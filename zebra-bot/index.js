const { initializeApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");
const { getFirestore, collection, query, where, onSnapshot, doc, updateDoc } = require("firebase/firestore");
const fetch = require("node-fetch");
const readline = require("readline");

const firebaseConfig = {
  apiKey: "AIzaSyCAH2Vm2Or_V07AL4MvtPGFVKp6VFfpkW8",
  authDomain: "sistemasimpressorasnkv.firebaseapp.com",
  projectId: "sistemasimpressorasnkv",
  storageBucket: "sistemasimpressorasnkv.firebasestorage.app",
  messagingSenderId: "1070278535635",
  appId: "1:1070278535635:web:c110b677d2b3ab1c712726",
  measurementId: "G-7LCMEBJG21"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ZEBRA_API = "http://127.0.0.1:9100";
let activePrinter = null;

// Helpers de Cores para o Terminal
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m"
};

const log = (msg, color = colors.reset) => console.log(`${color}${msg}${colors.reset}`);

// ----------------------------------------------------
// 1. ZEBRA BROWSER PRINT INTEGRATION
// ----------------------------------------------------
async function discoverZebraPrinters() {
  log("\nProcurando impressoras Zebra conectadas...", colors.cyan);
  try {
    const res = await fetch(`${ZEBRA_API}/available`);
    const data = await res.json();
    
    if (data && data.printer && data.printer.length > 0) {
      // Tenta pegar a primeira
      activePrinter = data.printer[0];
      log(`[OK] Impressora detectada: ${activePrinter.name}`, colors.green);
      return true;
    } else {
      log(`[AVISO] Nenhuma impressora Zebra encontrada. Verifique se o cabo está conectado e se o Zebra Browser Print está rodando.`, colors.yellow);
      return false;
    }
  } catch (error) {
    log(`[ERRO CRÍTICO] Falha ao comunicar com o Zebra Browser Print. O aplicativo está aberto no Windows?`, colors.red);
    return false;
  }
}

async function sendZplToPrinter(zplCode) {
  if (!activePrinter) {
    const found = await discoverZebraPrinters();
    if (!found) throw new Error("Impressora offline");
  }

  const payload = {
    device: {
      deviceType: activePrinter.deviceType,
      uid: activePrinter.uid,
      provider: activePrinter.provider,
      name: activePrinter.name
    },
    data: zplCode
  };

  const response = await fetch(`${ZEBRA_API}/write`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Falha na API da Zebra: ${response.statusText}`);
  }
}

// ----------------------------------------------------
// 2. FIREBASE LISTENER
// ----------------------------------------------------
function startListening(userId) {
  log(`\n======================================================`, colors.magenta);
  log(`  ZEBRABOT ATIVADO - VIGIANDO FILA NA NUVEM`, colors.magenta);
  log(`======================================================`, colors.magenta);
  log(`O robô está rodando em segundo plano. Nunca feche esta tela se quiser continuar recebendo as etiquetas.\n`, colors.yellow);

  const jobsRef = collection(db, 'users', userId, 'print_jobs');
  const q = query(jobsRef, where('status', '==', 'pending'));

  onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === 'added') {
        const job = { id: change.doc.id, ...change.doc.data() };
        log(`\n[NOVA IMPRESSÃO] Arquivo Recebido: ${job.configName}`, colors.cyan);
        
        try {
          const jobRef = doc(db, 'users', userId, 'print_jobs', job.id);
          // 1. Marca como "Imprimindo"
          await updateDoc(jobRef, { status: 'printing' });
          
          // 2. Manda pra impressora local
          log(`  -> Enviando para a impressora local...`, colors.yellow);
          await sendZplToPrinter(job.zplCode);
          
          // 3. Marca como Sucesso
          await updateDoc(jobRef, { status: 'completed', completedAt: new Date().getTime() });
          log(`  -> [SUCESSO] Etiqueta impressa e nuvem atualizada!`, colors.green);
        } catch (error) {
          log(`  -> [ERRO] Falha ao imprimir: ${error.message}`, colors.red);
          const jobRef = doc(db, 'users', userId, 'print_jobs', job.id);
          await updateDoc(jobRef, { status: 'error', error: error.message, completedAt: new Date().getTime() });
        }
      }
    });
  });
}

// ----------------------------------------------------
// 3. STARTUP
// ----------------------------------------------------
async function boot() {
  console.clear();
  log(`*************************************************`, colors.cyan);
  log(`*              ZEBRA PRINT BOT                  *`, colors.cyan);
  log(`*  Conectando Nuvem -> Impressora Local         *`, colors.cyan);
  log(`*************************************************\n`, colors.cyan);

  const printerOk = await discoverZebraPrinters();
  if (!printerOk) {
    log("Aguardando impressora para continuar...", colors.yellow);
  }

  rl.question("\nE-mail do Sistema: ", (email) => {
    rl.question("Senha do Sistema: ", async (password) => {
      try {
        log("\nAutenticando na Nuvem...", colors.yellow);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        log(`[OK] Login realizado com sucesso! (UID: ${user.uid})`, colors.green);
        
        startListening(user.uid);
      } catch (error) {
        log(`\n[ERRO] Falha no login: ${error.message}`, colors.red);
        process.exit(1);
      }
    });
  });
}

boot();
