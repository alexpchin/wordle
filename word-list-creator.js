const fs = require("fs");

try {
  const data = fs.readFileSync("word-list-5.txt", "utf8");
  const words = data.split("\n");
  const uniq = [...new Set(words)];
  fs.writeFileSync("word-list-5-uniq.txt", uniq.join("\n"), "utf8");
} catch (e) {
  console.log("Error:", e.stack);
}
