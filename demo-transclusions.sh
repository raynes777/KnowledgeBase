#!/bin/bash
# =============================================================================
# DEMO TRANSCLUSION AVANZATE - Studio AURORA-2026
# =============================================================================
# Crea un grafo complesso di transclusion cross-documento che simula
# un trial clinico realistico con riferimenti incrociati tra 9 documenti.
#
# GRAFO FINALE:
#
#   PROTOCOL ──────────────────────┐
#     │  │  └──→ AMENDMENT ────────┤
#     │  └────→ ICF_MASTER ───┐    │
#     │           └──→ ICF_GEMELLI │
#     │           └──→ ICF_SANRAFF │
#     └────────→ SAE_001 ─────┤    │
#                  └──→ DSMB_REPORT│
#                  └──→ AUDIT ─────┘
#                         └──→ REGULATORY_SUMMARY
#
# =============================================================================

BASE="http://localhost:8080"
STEP=0

jv() { grep -o "\"$1\":\"[^\"]*\"" | head -1 | cut -d'"' -f4; }
jvn() { grep -o "\"$1\":[0-9]*" | head -1 | sed "s/\"$1\"://"; }

step() {
  STEP=$((STEP + 1))
  echo ""
  echo "=== STEP $STEP [$1] $2"
  echo "    $3 | Feature: $4"
}
ok() { echo "    OK: $1"; }

echo "============================================================================="
echo "  SIMULAZIONE TRANSCLUSION AVANZATE - Studio AURORA-2026"
echo "  Grafo di 9 documenti con 8 transclusion cross-reference"
echo "============================================================================="

# === FASE 0: LOGIN ===
echo ""
echo "--- Autenticazione ---"
SPONSOR_TOKEN=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"sponsor@pharma.com","password":"Sponsor2024"}' | jv accessToken)

RESEARCHER_TOKEN=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"researcher@hospital.it","password":"Research2024"}' | jv accessToken)

HOSPITAL_TOKEN=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"hospital@gemelli.it","password":"Hospital2024"}' | jv accessToken)
echo "Login completato per 3 utenti."

# === FASE 1: SPONSOR CREA I DOCUMENTI FONDAMENTALI ===

step "SPONSOR" "Crea Protocollo AURORA-2026 v2" "POST /api/documents" "Documento root del grafo"
PROTOCOL=$(curl -s -X POST "$BASE/api/documents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SPONSOR_TOKEN" \
  -d '{
    "title": "Protocollo AURORA-2026 v2.0 - Cardioflux 200mg - Fase III",
    "docType": "PROTOCOL",
    "initialContent": "PROTOCOLLO AURORA-2026 v2.0\n\nStudio di Fase III, multicentrico, randomizzato, in doppio cieco.\nFarmaco: Cardioflux 200mg vs Placebo.\nIndicazione: Scompenso cardiaco acuto (NYHA III-IV).\n\nEndpoint primario: Mortalita cardiovascolare a 18 mesi.\nEndpoint secondari: Riospedalizzazione, LVEF, qualita di vita (KCCQ).\n\nCampione: N=1200 pazienti, 15 centri italiani.\nDurata: 24 mesi arruolamento + 18 mesi follow-up."
  }')
PROTOCOL_ID=$(echo "$PROTOCOL" | jv id)
ok "Protocollo: $PROTOCOL_ID"

# Aggiungi sezioni strutturate al protocollo
step "SPONSOR" "Aggiunge Sezione Criteri" "POST sections" "Contenuto transcludibile"
curl -s -X POST "$BASE/api/documents/$PROTOCOL_ID/sections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SPONSOR_TOKEN" \
  -d '{
    "contentType": "STRING",
    "value": "CRITERI DI INCLUSIONE:\n1. Eta >= 18 anni\n2. Scompenso cardiaco acuto (ICD-10 I50.x)\n3. NYHA III-IV\n4. LVEF <= 40%\n5. NT-proBNP >= 1600 pg/mL\n\nCRITERI DI ESCLUSIONE:\n1. Shock cardiogeno\n2. IMA ultime 4 settimane\n3. eGFR < 20\n4. Uso sacubitril/valsartan (ultime 2 sett)\n5. Gravidanza"
  }' > /dev/null
ok "Sezione criteri aggiunta (v2)"

step "SPONSOR" "Aggiunge Sezione Procedure" "POST sections" "Altra sezione transcludibile"
curl -s -X POST "$BASE/api/documents/$PROTOCOL_ID/sections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SPONSOR_TOKEN" \
  -d '{
    "contentType": "STRING",
    "value": "PROCEDURE DELLO STUDIO:\n\nVisita 1 (Screening): Consenso, anamnesi, esami ematochimici, ECG 12 derivazioni, ecocardiogramma.\nVisita 2 (Randomizzazione): Verifica criteri, randomizzazione 1:1, prima dose.\nVisita 3 (Settimana 2): Titolazione dose, sicurezza, esami.\nVisite 4-7 (Mesi 1,3,6,9): Follow-up clinico, ECG, prelievi biomarcatori.\nVisita 8 (Mese 12): Ecocardiogramma, KCCQ, analisi intermedia.\nVisita 9 (Mese 18): Endpoint primario, chiusura studio."
  }' > /dev/null
ok "Sezione procedure aggiunta (v3)"

step "SPONSOR" "Aggiunge N. pazienti target" "POST sections" "INTEGER per campo strutturato"
curl -s -X POST "$BASE/api/documents/$PROTOCOL_ID/sections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SPONSOR_TOKEN" \
  -d '{"contentType": "INTEGER", "value": 1200}' > /dev/null
ok "Campo INTEGER aggiunto: N=1200 (v4)"

step "SPONSOR" "Crea ICF Master" "POST /api/documents" "Documento di consenso master"
ICF_MASTER=$(curl -s -X POST "$BASE/api/documents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SPONSOR_TOKEN" \
  -d '{
    "title": "Consenso Informato Master - AURORA-2026",
    "docType": "ICF",
    "initialContent": "MODULO DI CONSENSO INFORMATO\nStudio AURORA-2026 - Cardioflux 200mg\n\nGentile Paziente,\nLe chiediamo di partecipare allo studio AURORA-2026.\n\nSCOPO: Verificare se Cardioflux 200mg riduce il rischio cardiovascolare.\n\nDURATA: 18 mesi di follow-up con 9 visite programmate.\n\nRISCHI: Ipotensione (5%), vertigini (3%), bradicardia (2%), alterazioni renali (1%).\nBENEFICI POTENZIALI: Miglioramento della funzione cardiaca e riduzione riospedalizzazioni.\n\nRISERVATEZZA: I dati saranno trattati secondo GDPR (Reg. UE 2016/679).\nVOLONTARIETA: Partecipazione libera, ritiro senza conseguenze."
  }')
ICF_MASTER_ID=$(echo "$ICF_MASTER" | jv id)
ok "ICF Master: $ICF_MASTER_ID"

# === FASE 2: HOSPITAL CREA DOCUMENTI LOCALI CON TRANSCLUSION ===

step "HOSPITAL" "Crea ICF Locale Gemelli" "POST /api/documents" "ICF sito Roma"
ICF_GEMELLI=$(curl -s -X POST "$BASE/api/documents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $HOSPITAL_TOKEN" \
  -d '{
    "title": "Consenso Informato AURORA-2026 - Policlinico Gemelli Roma",
    "docType": "ICF",
    "initialContent": "CONSENSO INFORMATO - ADATTAMENTO LOCALE\nPoliclinico Gemelli IRCCS, Roma\n\nInvestigatore Sito: Dr. Laura Verdi\nComitato Etico: CE Gemelli (Approvazione CE/2026/0456)\n\nINFO SITO:\n- Cardiologia Clinica, Piano 3 Ala B\n- Tel emergenze: +39 06 3015 4567\n- Orari: Lun-Ven 08:00-16:00\n\nNote: Il presente documento integra il consenso master dello Sponsor e i criteri del protocollo."
  }')
ICF_GEMELLI_ID=$(echo "$ICF_GEMELLI" | jv id)
ok "ICF Gemelli: $ICF_GEMELLI_ID"

step "HOSPITAL" "TRANSCLUSION 1: ICF Master -> ICF Gemelli" "POST transclude" "Gemelli include il consenso master"
T1=$(curl -s -X POST "$BASE/api/documents/$ICF_GEMELLI_ID/transclude" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $HOSPITAL_TOKEN" \
  -d "{\"sourceDocumentId\": \"$ICF_MASTER_ID\", \"sourceNodePath\": \"root\", \"targetNodePath\": \"consenso-master\"}")
T1_TX=$(echo "$T1" | jv iotaTxId)
ok "TRANSCLUSION 1: ICF Master --> ICF Gemelli | IOTA: $T1_TX"

step "HOSPITAL" "TRANSCLUSION 2: Protocollo -> ICF Gemelli" "POST transclude" "Gemelli include i criteri dal protocollo"
T2=$(curl -s -X POST "$BASE/api/documents/$ICF_GEMELLI_ID/transclude" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $HOSPITAL_TOKEN" \
  -d "{\"sourceDocumentId\": \"$PROTOCOL_ID\", \"sourceNodePath\": \"section-criteri\", \"targetNodePath\": \"criteri-protocollo\"}")
T2_TX=$(echo "$T2" | jv iotaTxId)
ok "TRANSCLUSION 2: Protocollo (criteri) --> ICF Gemelli | IOTA: $T2_TX"

# === FASE 3: RESEARCHER CREA DOCUMENTI SAN RAFFAELE ===

step "RESEARCHER" "Crea ICF Locale San Raffaele" "POST /api/documents" "ICF sito Milano"
ICF_SR=$(curl -s -X POST "$BASE/api/documents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RESEARCHER_TOKEN" \
  -d '{
    "title": "Consenso Informato AURORA-2026 - San Raffaele Milano",
    "docType": "ICF",
    "initialContent": "CONSENSO INFORMATO - ADATTAMENTO LOCALE\nPoliclinico San Raffaele, Milano\n\nInvestigatore Sito e PI: Prof. Giovanni Bianchi\nComitato Etico: CE IRCCS San Raffaele (Parere n. 45/2026)\n\nINFO SITO:\n- UO Cardiologia, Edificio H, Piano 2\n- Tel emergenze: +39 02 2643 7890\n- Orari: Lun-Sab 07:30-17:00\n- Laboratorio dedicato biomarcatori: Piano -1\n\nNote: Centro coordinatore del trial. Partecipa al sottostudio biomarcatori."
  }')
ICF_SR_ID=$(echo "$ICF_SR" | jv id)
ok "ICF San Raffaele: $ICF_SR_ID"

step "RESEARCHER" "TRANSCLUSION 3: ICF Master -> ICF San Raffaele" "POST transclude" "Anche San Raffaele include il master"
T3=$(curl -s -X POST "$BASE/api/documents/$ICF_SR_ID/transclude" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RESEARCHER_TOKEN" \
  -d "{\"sourceDocumentId\": \"$ICF_MASTER_ID\", \"sourceNodePath\": \"root\", \"targetNodePath\": \"consenso-master\"}")
T3_TX=$(echo "$T3" | jv iotaTxId)
ok "TRANSCLUSION 3: ICF Master --> ICF San Raffaele | IOTA: $T3_TX"

step "RESEARCHER" "TRANSCLUSION 4: Protocollo -> ICF San Raffaele" "POST transclude" "San Raffaele include procedure dal protocollo"
T4=$(curl -s -X POST "$BASE/api/documents/$ICF_SR_ID/transclude" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RESEARCHER_TOKEN" \
  -d "{\"sourceDocumentId\": \"$PROTOCOL_ID\", \"sourceNodePath\": \"section-procedure\", \"targetNodePath\": \"procedure-protocollo\"}")
T4_TX=$(echo "$T4" | jv iotaTxId)
ok "TRANSCLUSION 4: Protocollo (procedure) --> ICF San Raffaele | IOTA: $T4_TX"

step "RESEARCHER" "Crea Emendamento n.1" "POST /api/documents" "AMENDMENT con ref al protocollo"
AMEND=$(curl -s -X POST "$BASE/api/documents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RESEARCHER_TOKEN" \
  -d '{
    "title": "Emendamento Sostanziale n.1 - AURORA-2026",
    "docType": "AMENDMENT",
    "initialContent": "EMENDAMENTO SOSTANZIALE N. 1\n\n1. Endpoint primario esteso da 12 a 18 mesi.\n2. Sottostudio biomarcatori: hs-cTnI, Galectina-3, sST2.\n3. Nuovo criterio esclusione: sacubitril/valsartan.\n4. Aggiunta visita intermedia al mese 15.\n\nRationale: Dati ESC Heart Failure 2025 suggeriscono beneficio tardivo."
  }')
AMEND_ID=$(echo "$AMEND" | jv id)
ok "Emendamento: $AMEND_ID"

step "RESEARCHER" "TRANSCLUSION 5: Protocollo -> Emendamento" "POST transclude" "Emendamento riferisce il protocollo originale"
T5=$(curl -s -X POST "$BASE/api/documents/$AMEND_ID/transclude" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RESEARCHER_TOKEN" \
  -d "{\"sourceDocumentId\": \"$PROTOCOL_ID\", \"sourceNodePath\": \"root\", \"targetNodePath\": \"protocollo-originale\"}")
T5_TX=$(echo "$T5" | jv iotaTxId)
ok "TRANSCLUSION 5: Protocollo --> Emendamento | IOTA: $T5_TX"

# === FASE 4: SAE E DSMB REPORT ===

step "HOSPITAL" "Crea SAE Report #001" "POST /api/documents" "Evento avverso grave"
SAE=$(curl -s -X POST "$BASE/api/documents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $HOSPITAL_TOKEN" \
  -d '{
    "title": "SAE Report #001 - Ipotensione Severa - AURORA-GEM-042",
    "docType": "SAE_REPORT",
    "initialContent": "SAE REPORT\nRef: AURORA-SAE-001 | Paziente: AURORA-GEM-042 (67M)\n\nEvento: Ipotensione severa con sincope (PA 75/45)\nData: 24 Feb 2026 (Giorno 42 post-randomizzazione)\nGravita: Ospedalizzazione prolungata (3 gg UTIC)\nEsito: Risolto con sequele\nCausalita: Possibilmente correlato\n\nAzione: Farmaco sospeso definitivamente. Paziente in follow-up."
  }')
SAE_ID=$(echo "$SAE" | jv id)
ok "SAE Report: $SAE_ID"

step "HOSPITAL" "TRANSCLUSION 6: Protocollo -> SAE" "POST transclude" "SAE riferisce i criteri del protocollo"
T6=$(curl -s -X POST "$BASE/api/documents/$SAE_ID/transclude" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $HOSPITAL_TOKEN" \
  -d "{\"sourceDocumentId\": \"$PROTOCOL_ID\", \"sourceNodePath\": \"section-criteri\", \"targetNodePath\": \"criteri-inclusione-paziente\"}")
T6_TX=$(echo "$T6" | jv iotaTxId)
ok "TRANSCLUSION 6: Protocollo (criteri) --> SAE Report | IOTA: $T6_TX"

step "RESEARCHER" "Crea DSMB Report (Data Safety Monitoring Board)" "POST /api/documents" "Report sicurezza multi-fonte"
DSMB=$(curl -s -X POST "$BASE/api/documents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RESEARCHER_TOKEN" \
  -d '{
    "title": "DSMB Report n.1 - Analisi Sicurezza AURORA-2026",
    "docType": "AUDIT_REPORT",
    "initialContent": "REPORT DSMB - ANALISI DI SICUREZZA\nData riunione: 26 Feb 2026\nMembri: Prof. Bianchi (PI), Dr. Neri (statistico), Dr. Conti (farmacologo)\n\nANALISI:\n- 156 pazienti randomizzati, 148 in follow-up\n- 1 SAE segnalato (AURORA-SAE-001): ipotensione severa\n- Tasso SAE: 0.64% (atteso <2%: ACCETTABILE)\n- Nessun decesso correlato al trattamento\n\nRACCOMANDAZIONE: Proseguire lo studio senza modifiche.\nMonitoraggio PA intensificato per pazienti >65 anni."
  }')
DSMB_ID=$(echo "$DSMB" | jv id)
ok "DSMB Report: $DSMB_ID"

step "RESEARCHER" "TRANSCLUSION 7: SAE -> DSMB Report" "POST transclude" "DSMB include il SAE per analisi"
T7=$(curl -s -X POST "$BASE/api/documents/$DSMB_ID/transclude" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RESEARCHER_TOKEN" \
  -d "{\"sourceDocumentId\": \"$SAE_ID\", \"sourceNodePath\": \"root\", \"targetNodePath\": \"sae-analizzato\"}")
T7_TX=$(echo "$T7" | jv iotaTxId)
ok "TRANSCLUSION 7: SAE Report --> DSMB Report | IOTA: $T7_TX"

# === FASE 5: REGULATORY SUMMARY - DOCUMENTO CHE TRANSCLUDE DA TUTTO ===

step "SPONSOR" "Crea Regulatory Summary (hub documentale)" "POST /api/documents" "Documento che aggrega tutto"
REGSUMMARY=$(curl -s -X POST "$BASE/api/documents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SPONSOR_TOKEN" \
  -d '{
    "title": "Regulatory Summary - AURORA-2026 - Submission AIFA",
    "docType": "AUDIT_REPORT",
    "initialContent": "REGULATORY SUMMARY PER AIFA\nStudio AURORA-2026 - Cardioflux 200mg\nData: 26 Febbraio 2026\n\nQuesta summary aggrega per riferimento tutti i documenti chiave del trial clinico AURORA-2026 per la submission regolatoria ad AIFA.\n\nDOCUMENTI INCLUSI PER TRANSCLUSION:\n1. Protocollo Studio (con emendamento)\n2. Consenso Informato Master\n3. SAE Report e analisi DSMB\n4. Emendamento Sostanziale n.1\n\nSTATO: Conforme GCP-ICH E6(R2). Nessuna deviazione critica."
  }')
REGSUMMARY_ID=$(echo "$REGSUMMARY" | jv id)
ok "Regulatory Summary: $REGSUMMARY_ID"

step "SPONSOR" "TRANSCLUSION 8: Protocollo -> Regulatory Summary" "POST transclude" "Summary include il protocollo"
T8=$(curl -s -X POST "$BASE/api/documents/$REGSUMMARY_ID/transclude" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SPONSOR_TOKEN" \
  -d "{\"sourceDocumentId\": \"$PROTOCOL_ID\", \"sourceNodePath\": \"root\", \"targetNodePath\": \"protocollo-completo\"}")
ok "TRANSCLUSION 8: Protocollo --> Regulatory Summary"

step "SPONSOR" "TRANSCLUSION 9: ICF Master -> Regulatory Summary" "POST transclude" "Summary include ICF master"
T9=$(curl -s -X POST "$BASE/api/documents/$REGSUMMARY_ID/transclude" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SPONSOR_TOKEN" \
  -d "{\"sourceDocumentId\": \"$ICF_MASTER_ID\", \"sourceNodePath\": \"root\", \"targetNodePath\": \"icf-master\"}")
ok "TRANSCLUSION 9: ICF Master --> Regulatory Summary"

step "SPONSOR" "TRANSCLUSION 10: Emendamento -> Regulatory Summary" "POST transclude" "Summary include emendamento"
T10=$(curl -s -X POST "$BASE/api/documents/$REGSUMMARY_ID/transclude" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SPONSOR_TOKEN" \
  -d "{\"sourceDocumentId\": \"$AMEND_ID\", \"sourceNodePath\": \"root\", \"targetNodePath\": \"emendamento\"}")
ok "TRANSCLUSION 10: Emendamento --> Regulatory Summary"

step "SPONSOR" "TRANSCLUSION 11: DSMB Report -> Regulatory Summary" "POST transclude" "Summary include analisi DSMB"
T11=$(curl -s -X POST "$BASE/api/documents/$REGSUMMARY_ID/transclude" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SPONSOR_TOKEN" \
  -d "{\"sourceDocumentId\": \"$DSMB_ID\", \"sourceNodePath\": \"root\", \"targetNodePath\": \"dsmb-sicurezza\"}")
ok "TRANSCLUSION 11: DSMB Report --> Regulatory Summary"

# === FASE 6: ANALISI DEL GRAFO DI TRANSCLUSION ===

echo ""
echo "============================================================================="
echo "  ANALISI DEL GRAFO DI TRANSCLUSION"
echo "============================================================================="

echo ""
echo "--- Protocollo: transclusion in uscita (documento piu referenziato) ---"
curl -s "$BASE/api/documents/$PROTOCOL_ID/transclusions/outgoing" \
  -H "Authorization: Bearer $SPONSOR_TOKEN" | grep -o '"targetNodePath":"[^"]*"' | while read line; do echo "    $line"; done
PROTO_OUT=$(curl -s "$BASE/api/documents/$PROTOCOL_ID/transclusions/outgoing" \
  -H "Authorization: Bearer $SPONSOR_TOKEN" | grep -o '"id"' | wc -l)
echo "    Totale: $PROTO_OUT transclusion in uscita dal Protocollo"

echo ""
echo "--- ICF Master: transclusion in uscita ---"
ICF_OUT=$(curl -s "$BASE/api/documents/$ICF_MASTER_ID/transclusions/outgoing" \
  -H "Authorization: Bearer $SPONSOR_TOKEN" | grep -o '"id"' | wc -l)
echo "    Totale: $ICF_OUT transclusion in uscita dall ICF Master"

echo ""
echo "--- ICF Gemelli: transclusion in entrata ---"
GEM_IN=$(curl -s "$BASE/api/documents/$ICF_GEMELLI_ID/transclusions/incoming" \
  -H "Authorization: Bearer $HOSPITAL_TOKEN" | grep -o '"id"' | wc -l)
echo "    Totale: $GEM_IN transclusion in entrata nell ICF Gemelli"

echo ""
echo "--- ICF San Raffaele: transclusion in entrata ---"
SR_IN=$(curl -s "$BASE/api/documents/$ICF_SR_ID/transclusions/incoming" \
  -H "Authorization: Bearer $RESEARCHER_TOKEN" | grep -o '"id"' | wc -l)
echo "    Totale: $SR_IN transclusion in entrata nell ICF San Raffaele"

echo ""
echo "--- Regulatory Summary: transclusion in entrata (hub) ---"
REG_IN=$(curl -s "$BASE/api/documents/$REGSUMMARY_ID/transclusions/incoming" \
  -H "Authorization: Bearer $SPONSOR_TOKEN" | grep -o '"id"' | wc -l)
echo "    Totale: $REG_IN transclusion in entrata nella Regulatory Summary"

echo ""
echo "--- SAE Report: transclusion in uscita e in entrata ---"
SAE_OUT=$(curl -s "$BASE/api/documents/$SAE_ID/transclusions/outgoing" \
  -H "Authorization: Bearer $HOSPITAL_TOKEN" | grep -o '"id"' | wc -l)
SAE_IN=$(curl -s "$BASE/api/documents/$SAE_ID/transclusions/incoming" \
  -H "Authorization: Bearer $HOSPITAL_TOKEN" | grep -o '"id"' | wc -l)
echo "    In uscita: $SAE_OUT (verso DSMB) | In entrata: $SAE_IN (dal Protocollo)"

# === FASE 7: STATISTICHE UTENTE FINALI ===

echo ""
echo "============================================================================="
echo "  STATISTICHE UTENTE"
echo "============================================================================="

SPONSOR_UID=$(echo "$SPONSOR_TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)
RESEARCHER_UID=$(echo "$RESEARCHER_TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)
HOSPITAL_UID=$(echo "$HOSPITAL_TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)

echo ""
echo "  Dr. Maria Rossi (SPONSOR):"
curl -s "$BASE/api/users/$SPONSOR_UID/stats" -H "Authorization: Bearer $SPONSOR_TOKEN"
echo ""
echo "  Prof. Giovanni Bianchi (RESEARCHER):"
curl -s "$BASE/api/users/$RESEARCHER_UID/stats" -H "Authorization: Bearer $RESEARCHER_TOKEN"
echo ""
echo "  Dr. Laura Verdi (HOSPITAL):"
curl -s "$BASE/api/users/$HOSPITAL_UID/stats" -H "Authorization: Bearer $HOSPITAL_TOKEN"

# === RIEPILOGO FINALE ===

echo ""
echo ""
echo "============================================================================="
echo "  GRAFO TRANSCLUSION COMPLETATO"
echo "============================================================================="
echo ""
echo "  9 Documenti creati:"
echo "    1. [PROTOCOL]     Protocollo AURORA-2026 v2.0 (4 versioni, 3 sezioni)"
echo "    2. [ICF]          Consenso Informato Master"
echo "    3. [ICF]          Consenso Informato - Gemelli Roma"
echo "    4. [ICF]          Consenso Informato - San Raffaele Milano"
echo "    5. [AMENDMENT]    Emendamento Sostanziale n.1"
echo "    6. [SAE_REPORT]   SAE Report #001"
echo "    7. [AUDIT_REPORT] DSMB Report n.1"
echo "    8. [AUDIT_REPORT] Regulatory Summary AIFA"
echo ""
echo "  11 Transclusion (cross-reference):"
echo ""
echo "    PROTOCOLLO (fonte principale - 4 transclusion in uscita)"
echo "       |---> ICF Gemelli (criteri)"
echo "       |---> ICF San Raffaele (procedure)"
echo "       |---> Emendamento (protocollo originale)"
echo "       |---> Regulatory Summary"
echo ""
echo "    ICF MASTER (2 transclusion in uscita)"
echo "       |---> ICF Gemelli"
echo "       |---> ICF San Raffaele"
echo "       |---> Regulatory Summary"
echo ""
echo "    SAE REPORT (nodo intermedio: 1 in entrata, 1 in uscita)"
echo "       <--- Protocollo (criteri paziente)"
echo "       |---> DSMB Report"
echo ""
echo "    REGULATORY SUMMARY (hub: 4 transclusion in entrata)"
echo "       <--- Protocollo"
echo "       <--- ICF Master"
echo "       <--- Emendamento"
echo "       <--- DSMB Report"
echo ""
echo "  Tutte le transclusion notarizzate su IOTA Tangle (mock)."
echo "  Apri http://localhost:3000 per vedere il grafo nella dashboard!"
echo ""
echo "============================================================================="
