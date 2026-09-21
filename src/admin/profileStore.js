// The bits of Lara's profile that live only in her browser (phone, birthday,
// location, bio and profile photo). Her name and password are saved on the
// server; see AdminRolePage.jsx.
import { useEffect, useState } from "react";

const KEY = "laras-admin-profile-extra";
const EVENT = "laras-admin-profile-changed";

export function readExtra() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

export function writeExtra(patch) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readExtra(), ...patch }));
  } catch {
    /* storage full or blocked — the profile photo just won't stick */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useProfileExtra() {
  const [extra, setExtra] = useState(readExtra);
  useEffect(() => {
    const update = () => setExtra(readExtra());
    window.addEventListener(EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return extra;
}

// shrinks a chosen photo to a small square so it fits comfortably in storage
export function photoToDataUrl(file, size = 256) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      canvas.getContext("2d").drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file isn't a picture we can read."));
    };
    img.src = url;
  });
}
