import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy initialization for Stripe
let stripeInstance: Stripe | null = null;
const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY no está configurada en los Secrets.");
  }
  // If the key starts with mk_, it's definitely wrong
  if (key.startsWith('mk_')) {
    throw new Error("Has configurado una clave que empieza por 'mk_'. Esa clave NO es de Stripe. Por favor, busca la 'Secret key' en tu panel de Stripe que empieza por 'sk_'.");
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(key);
  }
  return stripeInstance;
};

// Initialize Supabase Admin Client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Request Logger
  app.use((req, res, next) => {
    console.log(`>>> ${req.method} ${req.url}`);
    next();
  });

  // Stripe Webhook (must be before express.json())
  app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(
        req.body,
        sig as string,
        process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock'
      );
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`Webhook received: ${event.type}`);

    try {
      const data = event.data.object as any;
      const metadata = data.metadata || {};
      const userId = data.client_reference_id || metadata.userId;

      switch (event.type) {
        // -----------------------------
        // 1. CHECKOUT COMPLETADO
        // -----------------------------
        case 'checkout.session.completed': {
          if (userId && supabaseAdmin) {
            console.log(`✔ Premium activado por checkout para: ${userId}`);
            const { error } = await supabaseAdmin
              .from('profiles')
              .update({ 
                plan: 'premium',
                is_premium: true,
                premium_since: new Date().toISOString(),
                stripe_customer_id: data.customer as string
              })
              .eq('id', userId);
            
            if (error) throw error;
          }
          break;
        }

        // -----------------------------
        // 2. SUSCRIPCIÓN CREADA
        // -----------------------------
        case 'customer.subscription.created': {
          let targetUserId = userId;
          
          if (!targetUserId && data.customer && supabaseAdmin) {
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('id')
              .eq('stripe_customer_id', data.customer as string)
              .single();
            if (profile) targetUserId = profile.id;
          }

          if (targetUserId && supabaseAdmin) {
            console.log(`✔ Premium activado (suscripción creada) para: ${targetUserId}`);
            const { error } = await supabaseAdmin
              .from('profiles')
              .update({ 
                plan: 'premium',
                is_premium: true,
                premium_since: new Date().toISOString(),
                stripe_customer_id: data.customer as string
              })
              .eq('id', targetUserId);
            
            if (error) throw error;
          }
          break;
        }

        // -----------------------------
        // 3. SUSCRIPCIÓN ACTUALIZADA (renovación)
        // -----------------------------
        case 'customer.subscription.updated': {
          let targetUserId = userId;
          
          if (!targetUserId && data.customer && supabaseAdmin) {
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('id')
              .eq('stripe_customer_id', data.customer as string)
              .single();
            if (profile) targetUserId = profile.id;
          }

          if (targetUserId && supabaseAdmin) {
            if (data.status === 'active') {
              console.log(`✔ Premium renovado para: ${targetUserId}`);
              const { error } = await supabaseAdmin
                .from('profiles')
                .update({ 
                  plan: 'premium',
                  is_premium: true 
                })
                .eq('id', targetUserId);
              
              if (error) throw error;
            }
          }
          break;
        }

        // -----------------------------
        // 4. SUSCRIPCIÓN CANCELADA
        // -----------------------------
        case 'customer.subscription.deleted': {
          if (userId && supabaseAdmin) {
            console.log(`❌ Premium desactivado (cancelado) para: ${userId}`);
            const { error } = await supabaseAdmin
              .from('profiles')
              .update({ 
                plan: 'free',
                is_premium: false 
              })
              .eq('id', userId);
            
            if (error) throw error;
          } else if (data.customer && supabaseAdmin) {
            // Fallback: find user by customer ID if metadata is missing
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('id')
              .eq('stripe_customer_id', data.customer as string)
              .single();

            if (profile) {
              const { error } = await supabaseAdmin
                .from('profiles')
                .update({ 
                  plan: 'free',
                  is_premium: false 
                })
                .eq('id', profile.id);
              if (error) throw error;
              console.log(`✔ User ${profile.id} downgraded via customer ID.`);
            }
          }
          break;
        }

        // -----------------------------
        // 5. PAGO DE RENOVACIÓN EXITOSO
        // -----------------------------
        case 'invoice.payment_succeeded': {
          let targetUserId = userId;
          
          if (!targetUserId && data.customer && supabaseAdmin) {
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('id')
              .eq('stripe_customer_id', data.customer as string)
              .single();
            if (profile) targetUserId = profile.id;
          }

          if (targetUserId && supabaseAdmin) {
            console.log(`✔ Renovación pagada para: ${targetUserId}`);
            const { error } = await supabaseAdmin
              .from('profiles')
              .update({ 
                plan: 'premium',
                is_premium: true 
              })
              .eq('id', targetUserId);
            
            if (error) throw error;
          }
          break;
        }

        // -----------------------------
        // 6. PAGO FALLIDO
        // -----------------------------
        case 'invoice.payment_failed': {
          let targetUserId = userId;
          
          if (!targetUserId && data.customer && supabaseAdmin) {
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('id')
              .eq('stripe_customer_id', data.customer as string)
              .single();
            if (profile) targetUserId = profile.id;
          }

          if (targetUserId && supabaseAdmin) {
            console.log(`❌ Pago fallido — Premium desactivado para: ${targetUserId}`);
            const { error } = await supabaseAdmin
              .from('profiles')
              .update({ 
                plan: 'free',
                is_premium: false 
              })
              .eq('id', targetUserId);
            
            if (error) throw error;
          }
          break;
        }
      }
    } catch (dbError: any) {
      console.error(`Database Error during webhook processing: ${dbError.message}`);
    }

    res.json({ received: true });
  });

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      supabase: !!supabaseAdmin,
      stripe: !!process.env.STRIPE_SECRET_KEY
    });
  });

  // API Routes
  app.post("/api/create-checkout-session", async (req, res) => {
    console.log(">>> POST /api/create-checkout-session reached");
    const { userId, userEmail, planType } = req.body;
    
    console.log(`Checkout request: User=${userId}, Email=${userEmail}, Plan=${planType}`);

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY is not set in environment variables");
      return res.status(500).json({ 
        error: "La clave secreta de Stripe no está configurada. Por favor, añádela en los Secrets de AI Studio." 
      });
    }

    let unitAmount = 2999; // Default 29.99€
    let planName = "DeenSnap Elite Premium (Anual)";
    let mode: Stripe.Checkout.Session.Mode = "subscription";
    let recurring: any = { interval: "year" };

    if (planType === 'monthly') {
      unitAmount = 299; // 2.99€
      planName = "DeenSnap Elite Premium (Mensual)";
      mode = "subscription";
      recurring = { interval: "month" };
    }

    const origin = req.headers.origin || process.env.APP_URL || `https://${req.headers.host}`;
    console.log(`Creating Stripe session for userId: ${userId}, origin: ${origin}, plan: ${planType}`);

    try {
      const stripe = getStripe();
      console.log("Stripe: Initializing checkout session...");
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: planName,
                description: "Acceso ilimitado a todas las funciones de DeenSnap",
              },
              unit_amount: unitAmount,
              ...(recurring ? { recurring } : {}),
            },
            quantity: 1,
          },
        ],
        mode: mode,
        client_reference_id: userId,
        ...(userEmail && typeof userEmail === 'string' && userEmail.includes('@') ? { customer_email: userEmail } : {}),
        metadata: {
          userId: userId,
          planType: planType
        },
        subscription_data: mode === 'subscription' ? {
          metadata: {
            userId: userId,
            planType: planType
          }
        } : undefined,
        success_url: `${origin}/?payment=success`,
        cancel_url: `${origin}/?payment=cancel`,
      });

      console.log("Stripe: Session created successfully:", session.id, "URL:", session.url);
      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe: Error during session creation:", error.message);
      if (error.type === 'StripeAuthenticationError') {
        res.status(401).json({ error: "Error de autenticación con Stripe. Por favor, verifica tu clave de API." });
      } else if (error.type === 'StripeInvalidRequestError') {
        res.status(400).json({ error: `Error en la solicitud a Stripe: ${error.message}` });
      } else {
        res.status(500).json({ error: `Error de Stripe: ${error.message}` });
      }
    }
  });

  // Catch-all for /api routes to ensure JSON response
  app.all("/api/*", (req, res) => {
    console.warn(`>>> API Route NOT FOUND: ${req.method} ${req.url}`);
    res.status(404).json({ error: `Ruta de API no encontrada: ${req.method} ${req.url}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(">>> GLOBAL ERROR HANDLER:", err);
    if (req.path.startsWith('/api')) {
      return res.status(500).json({ error: "Error interno del servidor en la API" });
    }
    next(err);
  });
}

startServer();
