/**
 * Menentukan apakah Zen mode perlu menampilkan siluet "Legend Incoming" —
 * yaitu SELAMA belum ada satu pun legend yang lahir HARI INI. Begitu legend
 * pertama hari itu muncul, teaser hilang dan digantikan koi emas asli.
 *
 * Fungsi murni: tidak menyentuh jaringan, mudah diuji.
 */
export function shouldTeaseLegend(todayLegends: { name: string }[]): boolean {
  if (!Array.isArray(todayLegends)) return true;
  return todayLegends.length === 0;
}
