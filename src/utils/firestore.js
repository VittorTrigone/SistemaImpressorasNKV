import { db } from '../firebase';
import { collection, doc, setDoc, onSnapshot, addDoc, updateDoc, query, where } from 'firebase/firestore';

// ---------------------------
// CONFIGURAÇÕES DE ETIQUETAS
// ---------------------------
export const subscribeToConfigs = (userId, callback) => {
  const docRef = doc(db, 'users', userId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists() && docSnap.data().configs) {
      callback(docSnap.data().configs);
    } else {
      callback([]);
    }
  });
};

export const saveConfigsToCloud = async (userId, configs) => {
  const docRef = doc(db, 'users', userId);
  await setDoc(docRef, { configs }, { merge: true });
};

// ---------------------------
// FILA DE IMPRESSÃO (RELAY)
// ---------------------------
export const sendCloudPrintJob = async (userId, configName, zplCode) => {
  const jobsRef = collection(db, 'users', userId, 'print_jobs');
  const newJob = await addDoc(jobsRef, {
    configName,
    zplCode,
    status: 'pending',
    createdAt: new Date().getTime(),
    error: null
  });
  return newJob.id;
};

export const subscribeToJobStatus = (userId, jobId, callback) => {
  const jobRef = doc(db, 'users', userId, 'print_jobs', jobId);
  return onSnapshot(jobRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    }
  });
};

export const listenToPendingJobs = (userId, callback) => {
  const jobsRef = collection(db, 'users', userId, 'print_jobs');
  const q = query(jobsRef, where('status', '==', 'pending'));
  
  return onSnapshot(q, (snapshot) => {
    const jobs = [];
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        jobs.push({ id: change.doc.id, ...change.doc.data() });
      }
    });
    if (jobs.length > 0) {
      callback(jobs);
    }
  });
};

export const updateJobStatus = async (userId, jobId, status, error = null) => {
  const jobRef = doc(db, 'users', userId, 'print_jobs', jobId);
  await updateDoc(jobRef, {
    status,
    error,
    completedAt: new Date().getTime()
  });
};
