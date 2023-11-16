import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBJChzYRGRgArygfh7HIRTvxc8jicec1o0",
  authDomain: "govconsearchrewards.firebaseapp.com",
  projectId: "govconsearchrewards",
  storageBucket: "govconsearchrewards.appspot.com",
  messagingSenderId: "26803410771",
  appId: "1:26803410771:web:7be10732889f7d521773a6",
  measurementId: "G-6264KFLH5K"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
