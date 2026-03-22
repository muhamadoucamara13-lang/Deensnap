const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <body style="background-color: #10b981; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif;">
        <div style="text-align: center;">
          <h1>DeenSnap JS Test</h1>
          <p>Si ves esto, el servidor Node.js en el puerto 3000 está funcionando.</p>
        </div>
      </body>
    </html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
