import firebase from 'firebase/app';
import 'firebase/database';

var firebaseConfig = {
  apiKey: "AIzaSyAmFYtVXhovd32ZhINx0AYp2obHhEbyZ1Q",
  authDomain: "sprintsolve.firebaseapp.com",
  databaseURL: "https://sprintsolve-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "sprintsolve",
  storageBucket: "sprintsolve.appspot.com",
  messagingSenderId: "931958489164",
  appId: "1:931958489164:web:7248abda53ede2ec9ef4e9",
  measurementId: "G-V4L6NX29HP"
}
const Fire = firebase.initializeApp(firebaseConfig);
const Database = firebase.database();

export {
  Fire, Database
}