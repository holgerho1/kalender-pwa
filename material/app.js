const SUPABASE_URL = "https://hzsgocmulzcxllihkmmh.supabase.co";
const SUPABASE_KEY = "sb_publishable_wPtPDhWmKxWQ6RJ42ljoNg_DEwYEaL1";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function log(...args) {
  const el = document.getElementById("log");
  el.textContent += args.map(a => JSON.stringify(a, null, 2)).join(" ") + "\n";
}

async function laden() {
  log("Lade…");

  const { data, error } = await supa
    .from("tabelle1")
    .select("feld1")
    .eq("id", 1)
    .single();

  log("SELECT RESULT:", data, error);

  if (data) {
    document.getElementById("eingabe").value = data.feld1 ?? "";
  }
}

async function speichern() {
  const wert = document.getElementById("eingabe").value;

  const { data, error } = await supa
    .from("tabelle1")
    .update({ feld1: wert })
    .eq("id", 1)
    .select();

  log("UPDATE RESULT:", data, error);

  await laden();
}

laden();