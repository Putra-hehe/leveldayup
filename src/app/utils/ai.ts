import { QuestDifficulty, User } from '../types';

export interface QuestTemplate {
  title: string;
  description?: string;
  difficulty: QuestDifficulty;
  tags?: string[];
}

const fallbackQuests: QuestTemplate[] = [
  { title: 'Latihan Pernapasan Hunter', description: 'Lakukan teknik pernapasan fokus selama 5 menit.', difficulty: 'easy', tags: ['meditasi'] },
  { title: 'Push-up Harian', description: 'Lakukan 20 push-up untuk meningkatkan kekuatan fisik.', difficulty: 'normal', tags: ['olahraga'] },
  { title: 'Eksplorasi Skill Baru', description: 'Pelajari satu konsep pemrograman baru selama 30 menit.', difficulty: 'hard', tags: ['belajar'] }
];

export async function generateSmartQuest(user: User | null, mood: string = 'normal'): Promise<QuestTemplate> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  const userLevel = user?.level || 1;

  console.log("Mengecek API Key...", apiKey ? "Kunci Ditemukan! 🔑" : "Kunci KOSONG! ❌");

  if (apiKey) {
    try {
      const prompt = `Kamu adalah mentor sistem produktivitas dari Levelday. Berikan 1 tugas produktivitas nyata untuk Hunter Level ${userLevel} yang sedang merasa '${mood}'. 
      Format jawaban harus JSON murni tanpa teks lain: 
      {"title": "Nama Tugas", "description": "Deskripsi", "difficulty": "easy", "tags": ["fokus"]}`;

      console.log("Menghubungi System AI (Jalur v1beta)...");
      
      // Jalur v1beta biasanya lebih stabil untuk model Flash di tahun 2026
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || "Koneksi API Gagal");
      }

      const aiText = data.candidates[0].content.parts[0].text;
      console.log("Sistem Berhasil Merespons!");
      
      // Bersihkan teks dari format markdown jika ada
      const cleanJson = aiText.replace(/```json/gi, '').replace(/```/gi, '').trim();
      return JSON.parse(cleanJson) as QuestTemplate;

    } catch (error) {
      console.warn("AI System sibuk atau error, mengaktifkan Quest Cadangan...", error);
      // Jika error, langsung lempar ke bawah untuk pakai fallback
    }
  }

  // --- JAMINAN: Jika AI gagal, kita harus tetap memberikan Quest manual agar aplikasi tidak bengong ---
  console.log("Menggunakan Quest dari Database Lokal...");
  const randomIndex = Math.floor(Math.random() * fallbackQuests.length);
  return fallbackQuests[randomIndex];
}