import express from 'express';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  app.use(express.json());

  // Store all session cookies here
  let activeSessionCookies = '';

  // --- 1. REAL SCHOOLACCESS LOGIN ROUTE ---
  app.post('/api/school/login', async (req: any, res: any) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Debe ingresar usuario y contraseña.' });
      }

      // CodeCharge Studio login form endpoint and exact form parameter names
      const loginUrl = 'https://crp.school-access.com/schoolaccess_internet/login_inicial.asp?ccsForm=Login';
              
      const params = new URLSearchParams({
        usuario: username,
        contrasena: password,
        Button_DoLogin: 'Ingresar'
      });

      const response = await fetch(loginUrl, {
        method: 'POST',
        body: params,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Referer': 'https://crp.school-access.com/schoolaccess_internet/Login_inicial.asp',
          'Origin': 'https://crp.school-access.com'
        },
        redirect: 'manual' 
      });

      // Extract cookies from response
      let cookiesStr = '';
      if (typeof (response.headers as any).getSetCookie === 'function') {
        const cookies = (response.headers as any).getSetCookie();
        if (cookies && cookies.length > 0) {
          cookiesStr = cookies.map((c: string) => c.split(';')[0]).join('; ');
        }
      }
      
      if (!cookiesStr && typeof (response.headers as any).raw === 'function') {
        const rawCookies = (response.headers as any).raw()['set-cookie'];
        if (rawCookies && rawCookies.length > 0) {
          cookiesStr = rawCookies.map((c: string) => c.split(';')[0]).join('; ');
        }
      }

      const status = response.status;
      const location = response.headers.get('location') || '';

      // Success in CodeCharge Studio is indicated by a redirect to Menu_principal.asp or dashboard
      if ((status === 302 || status === 303) && location && !location.toLowerCase().includes('login')) {
        if (!cookiesStr) {
          return res.status(401).json({ success: false, error: 'No se recibió cookie de sesión válida del servidor escolar.' });
        }
        activeSessionCookies = cookiesStr;
        return res.json({ success: true, message: 'Autenticado en SchoolAccess con éxito', target: location });
      }

      // If status is 200, CodeCharge re-rendered the login page because credentials failed
      const html = await response.text();
      const $ = cheerio.load(html);
      const errorMsg = $('.SchoolAccess_SchoolSiteErrorDataTD').text().trim();

      if (errorMsg || html.includes('Usuario o contrase') || html.includes('incorrecto') || html.includes('name="Login"')) {
        activeSessionCookies = ''; // Clear any unauthenticated cookie
        return res.status(401).json({ 
          success: false, 
          error: errorMsg || 'Usuario o contraseña incorrectos en SchoolAccess. Verifica tus credenciales.' 
        });
      }

      if (status >= 400) {
        activeSessionCookies = '';
        return res.status(status).json({ success: false, error: `Error HTTP ${status} en el servidor de la escuela.` });
      }

      // If no error text and cookies present
      if (cookiesStr) {
        activeSessionCookies = cookiesStr;
        return res.json({ success: true, message: 'Conectado a SchoolAccess' });
      }

      activeSessionCookies = '';
      return res.status(401).json({ success: false, error: 'No se pudo verificar la sesión con SchoolAccess.' });
    } catch (error: any) {
      activeSessionCookies = '';
      res.status(500).json({ success: false, error: error.message || 'Error de red al conectar con SchoolAccess.' });
    }
  });

  // --- 2. REAL SCHOOLACCESS FETCH ASSIGNMENTS ROUTE ---
  app.get('/api/school/assignments', async (req: any, res: any) => {
    try {
      if (!activeSessionCookies) {
        return res.status(401).json({ success: false, error: 'No hay sesión activa. Inicia sesión primero.' });
      }

      const targetUrl = 'https://crp.school-access.com/schoolaccess_internet/estudiante_asignaciones.asp';
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Cookie': activeSessionCookies,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Referer': 'https://crp.school-access.com/schoolaccess_internet/Menu_principal.asp'
        },
        redirect: 'manual'
      });

      const status = response.status;
      const location = response.headers.get('location') || '';

      // If redirected to sesion_expirada.asp or Login_inicial.asp, the session was not authenticated!
      if ((status === 302 || status === 303) && (location.includes('sesion_expirada') || location.includes('login') || location.includes('Login'))) {
        activeSessionCookies = '';
        return res.status(401).json({ 
          success: false, 
          error: 'La sesión en SchoolAccess expiró o no fue autorizada (redirección a sesion_expirada.asp).' 
        });
      }

      const html = await response.text();
      
      // Check if session expired or page redirected inside HTML
      if (html.includes('sesion_expirada.asp') || html.includes('Object Moved') || html.includes('Login_inicial.asp')) {
        activeSessionCookies = '';
        return res.status(401).json({ 
          success: false, 
          error: 'La sesión en SchoolAccess no es válida o expiró. Debes iniciar sesión con credenciales reales.' 
        });
      }

      const $ = cheerio.load(html);
      const assignments: any[] = [];

      $('table tr').each((index, el) => {
        if (index === 0) return;
        const tds = $(el).find('td');
        if (tds.length >= 2) {
          const subject = tds.eq(0).text().trim();
          const title = tds.eq(1).text().trim();
          const dueDate = tds.eq(2).text().trim();
          if (title && !title.toLowerCase().includes('sesión') && !title.toLowerCase().includes('iniciar')) {
            assignments.push({ subject: subject || 'Escuela', title, dueDate, source: 'SchoolAccess' });
          }
        }
      });

      res.json({ success: true, count: assignments.length, data: assignments });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Fallo interno al procesar asignaciones de SchoolAccess' });
    }
  });

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { 
      middlewareMode: true,
      allowedHosts: true
    },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on http://localhost:3000');
  });
}

startServer();
