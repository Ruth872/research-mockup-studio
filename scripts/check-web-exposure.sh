#!/usr/bin/env bash
# Confirms that web servers do not expose this project's files.
# Every listed path must answer 403 or 404; anything else (200, 500, ...) fails.
#
# Usage:
#   scripts/check-web-exposure.sh [base-url]          Apache: nothing may be served
#   scripts/check-web-exposure.sh --vite [base-url]   Vite dev server: only the app may be served
set -u

mode="apache"
if [[ "${1:-}" == "--vite" ]]; then
  mode="vite"
  shift
fi

if [[ "$mode" == "vite" ]]; then
  base_url="${1:-http://localhost:8080}"
else
  base_url="${1:-http://localhost/research-mockup-studio-main}"
fi

paths=(
  ".env"
  ".env.example"
  ".git/config"
  ".gitignore"
  ".htaccess"
  "package.json"
  "docs/phase-1-scope-and-architecture.md"
  "tele-triage-main/tele-triage-main/train.csv"
  "tele-triage-main/tele-triage-main/teletriage_dataset.zip"
  "research-mockup-studio-main/package.json"
  "test_db.php"
  "test_engine.php"
  "test_symptoms.php"
  "backend/"
  "backend/.env"
  "backend/.htaccess"
  "backend/teletriage.db"
  "backend/cases_store.json"
  "backend/db.sql"
  "backend/alembic.ini"
  "backend/app/main.py"
  "backend/app/core/config.py"
  "backend/model/triage_model.pkl"
  "backend/.venv/pyvenv.cfg"
  "ml_service/main.py"
)

# Apache must not serve the app shell either; the Vite dev server must.
# Vite serves any .html file under the root regardless of server.fs.allow, so the
# public build shell dist/index.html is only checked against Apache.
if [[ "$mode" == "apache" ]]; then
  paths+=("" "index.html" "src/App.tsx" "dist/index.html")
else
  for required in "" "src/main.tsx" "@vite/client"; do
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$base_url/$required")
    if [[ "$code" != "200" ]]; then
      echo "FAIL  $code  /$required (the app itself must load)"
      exit 1
    fi
  done
fi

# Vite answers unknown paths with the app shell (200) for client-side routing.
# That page is not a project file, so it counts as blocked.
shell=""
if [[ "$mode" == "vite" ]]; then
  shell=$(curl -s --max-time 10 "$base_url/")
fi

failures=0
for path in "${paths[@]}"; do
  body_file=$(mktemp)
  code=$(curl -s -o "$body_file" -w '%{http_code}' --max-time 10 "$base_url/$path")
  is_shell=false
  if [[ "$mode" == "vite" && "$code" == "200" && "$(cat "$body_file")" == "$shell" ]]; then
    is_shell=true
  fi
  rm -f "$body_file"
  if [[ "$is_shell" == true ]]; then
    printf 'ok    app shell  /%s\n' "$path"
  elif [[ "$code" == "403" || "$code" == "404" ]]; then
    printf 'ok    %s  /%s\n' "$code" "$path"
  else
    printf 'FAIL  %s  /%s\n' "$code" "$path"
    failures=$((failures + 1))
  fi
done

if (( failures > 0 )); then
  echo "$failures path(s) exposed or erroring."
  exit 1
fi
echo "All ${#paths[@]} paths blocked."
