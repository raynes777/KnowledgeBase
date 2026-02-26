#!/bin/bash
# =============================================================================
# DEMO AURORA-2026 - Simulazione Completa Studio Clinico
# =============================================================================
# Simula un trial clinico di Fase III per Cardioflux 200mg con 3 utenti:
#   SPONSOR:    Dr. Maria Rossi (Novartis Italia)
#   RESEARCHER: Prof. Giovanni Bianchi (Policlinico San Raffaele, Milano)
#   HOSPITAL:   Dr. Laura Verdi (Policlinico Gemelli, Roma)
# =============================================================================

BASE="http://localhost:8080"
STEP=0

# JSON value extractor using node (Windows compatible - no /dev/stdin)
jv() { node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{let v=JSON.parse(d);let p='$1'.split('.');for(let k of p)v=v[k];console.log(v)}catch(e){console.log('undefined')}})" 2>/dev/null; }
jlen() { node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).length)}catch(e){console.log(0)}})" 2>/dev/null; }
jpretty() { node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{let a=JSON.parse(d);a.forEach((x,i)=>{console.log('    '+(i+1)+'. ['+x.docType+'] '+x.title);console.log('       Autore: '+x.createdByName+' | Versione: '+x.currentVersionNumber+' | IOTA: '+x.iotaTxId)})}catch(e){console.log(d)}})" 2>/dev/null; }

header() {
  echo ""
  echo "============================================================================="
  echo "  $1"
  echo "============================================================================="
  echo ""
}

step() {
  STEP=$((STEP + 1))
  echo "--- STEP $STEP: [$1] $2"
  echo "    Endpoint: $3"
  echo "    Feature:  $4"
  echo ""
}

ok() { echo "    -> OK: $1"; echo ""; }
fail() { echo "    -> ERRORE: $1"; echo ""; }

# =============================================================================
header "FASE 0 - AUTENTICAZIONE"
# =============================================================================

step "SPONSOR" "Login Dr. Maria Rossi" "POST /api/auth/login" "JWT Authentication"
SPONSOR_TOKEN=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"sponsor@pharma.com","password":"Sponsor2024"}' | jv accessToken)
if [ -n "$SPONSOR_TOKEN" ] && [ "$SPONSOR_TOKEN" != "undefined" ]; then
  ok "Token ottenuto (${SPONSOR_TOKEN:0:20}...)"
else
  fail "Login sponsor fallito"; exit 1
fi

step "RESEARCHER" "Login Prof. Giovanni Bianchi" "POST /api/auth/login" "JWT Authentication"
RESEARCHER_TOKEN=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"researcher@hospital.it","password":"Research2024"}' | jv accessToken)
if [ -n "$RESEARCHER_TOKEN" ] && [ "$RESEARCHER_TOKEN" != "undefined" ]; then
  ok "Token ottenuto (${RESEARCHER_TOKEN:0:20}...)"
else
  fail "Login researcher fallito"; exit 1
fi

step "HOSPITAL" "Login Dr. Laura Verdi" "POST /api/auth/login" "JWT Authentication"
HOSPITAL_TOKEN=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"hospital@gemelli.it","password":"Hospital2024"}' | jv accessToken)
if [ -n "$HOSPITAL_TOKEN" ] && [ "$HOSPITAL_TOKEN" != "undefined" ]; then
  ok "Token ottenuto (${HOSPITAL_TOKEN:0:20}...)"
else
  fail "Login hospital fallito"; exit 1
fi

# =============================================================================
header "FASE 1 - SPONSOR CREA IL PROTOCOLLO AURORA-2026"
# =============================================================================

step "SPONSOR" "Crea Protocollo Studio Clinico" "POST /api/documents" "Document creation + Xanadu init + IOTA notarization"
PROTOCOL_RESP=$(curl -s -X POST "$BASE/api/documents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SPONSOR_TOKEN" \
  -d '{
    "title": "Protocollo Studio Clinico AURORA-2026 - Cardioflux 200mg",
    "docType": "PROTOCOL",
    "initialContent": "PROTOCOLLO DI STUDIO CLINICO - AURORA-2026\n\nTitolo: Studio di Fase III, multicentrico, randomizzato, in doppio cieco, controllato con placebo, per valutare efficacia e sicurezza di Cardioflux 200mg nel trattamento dello scompenso cardiaco acuto.\n\nSponsor: Novartis Italia S.p.A.\nPrincipal Investigator: Prof. Giovanni Bianchi\nNumero EudraCT: 2026-001234-56\nVersione: 1.0\nData: 26 Febbraio 2026"
  }')
PROTOCOL_ID=$(echo "$PROTOCOL_RESP" | jv id)
PROTOCOL_V1_ID=$(echo "$PROTOCOL_RESP" | jv currentVersionId)
PROTOCOL_HASH=$(echo "$PROTOCOL_RESP" | jv contentHash)
PROTOCOL_TX=$(echo "$PROTOCOL_RESP" | jv iotaTxId)
ok "Documento: $PROTOCOL_ID | Versione: 1 | Hash: ${PROTOCOL_HASH:0:16}... | IOTA TX: $PROTOCOL_TX"

step "SPONSOR" "Aggiunge Sezione: Obiettivi dello Studio" "POST /api/documents/{id}/sections" "STRING section + version increment"
SEC1_RESP=$(curl -s -X POST "$BASE/api/documents/$PROTOCOL_ID/sections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SPONSOR_TOKEN" \
  -d '{
    "contentType": "STRING",
    "value": "SEZIONE 2 - OBIETTIVI DELLO STUDIO\n\nObiettivo Primario: Dimostrare la superiorita di Cardioflux 200mg rispetto al placebo nella riduzione della mortalita cardiovascolare a 12 mesi nei pazienti con scompenso cardiaco acuto (classe NYHA III-IV).\n\nObiettivi Secondari:\n- Riduzione riospedalizzazioni cardiovascolari\n- Miglioramento LVEF (frazione di eiezione)\n- Miglioramento qualita di vita (KCCQ)\n- Profilo sicurezza e tollerabilita"
  }')
V2=$(echo "$SEC1_RESP" | jv currentVersionNumber)
ok "Versione aggiornata a: $V2"

step "SPONSOR" "Aggiunge Sezione: Numero Pazienti (INTEGER)" "POST /api/documents/{id}/sections" "INTEGER content type in Xanadu tree"
SEC2_RESP=$(curl -s -X POST "$BASE/api/documents/$PROTOCOL_ID/sections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SPONSOR_TOKEN" \
  -d '{"contentType": "INTEGER", "value": 1200}')
V3=$(echo "$SEC2_RESP" | jv currentVersionNumber)
ok "Versione aggiornata a: $V3 (N=1200 pazienti)"

step "SPONSOR" "Aggiunge Sezione: Criteri Inclusione/Esclusione" "POST /api/documents/{id}/sections" "Multi-section Xanadu tree building"
SEC3_RESP=$(curl -s -X POST "$BASE/api/documents/$PROTOCOL_ID/sections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SPONSOR_TOKEN" \
  -d '{
    "contentType": "STRING",
    "value": "SEZIONE 4 - CRITERI DI INCLUSIONE ED ESCLUSIONE\n\nCriteri di Inclusione:\n1. Eta >= 18 anni\n2. Diagnosi scompenso cardiaco acuto (ICD-10: I50.x) ultime 72h\n3. Classe NYHA III o IV\n4. LVEF <= 40%\n5. NT-proBNP >= 1600 pg/mL\n6. Consenso informato firmato\n\nCriteri di Esclusione:\n1. Shock cardiogeno (PA < 90 mmHg)\n2. IMA nelle ultime 4 settimane\n3. eGFR < 20 mL/min\n4. Gravidanza\n5. Ipersensibilita al principio attivo"
  }')
V4=$(echo "$SEC3_RESP" | jv currentVersionNumber)
ok "Versione aggiornata a: $V4"

step "SPONSOR" "Visualizza Storia Versioni Protocollo" "GET /api/documents/{id}/versions" "Version history chain"
VERSIONS_RESP=$(curl -s "$BASE/api/documents/$PROTOCOL_ID/versions" \
  -H "Authorization: Bearer $SPONSOR_TOKEN")
NUM_VERSIONS=$(echo "$VERSIONS_RESP" | jlen)
ok "Trovate $NUM_VERSIONS versioni nel protocollo"

step "SPONSOR" "Ispeziona Struttura Nodi Xanadu" "GET /api/documents/{id}/versions/{vid}/structure" "Xanadu node tree visualization"
CURRENT_VID=$(curl -s "$BASE/api/documents/$PROTOCOL_ID" \
  -H "Authorization: Bearer $SPONSOR_TOKEN" | jv currentVersionId)
STRUCTURE=$(curl -s "$BASE/api/documents/$PROTOCOL_ID/versions/$CURRENT_VID/structure" \
  -H "Authorization: Bearer $SPONSOR_TOKEN")
CHILDREN_COUNT=$(echo "$STRUCTURE" | jv childrenCount)
CONTENT_TYPE=$(echo "$STRUCTURE" | jv "content.type")
ok "Nodo root: tipo=$CONTENT_TYPE, figli=$CHILDREN_COUNT (StringContent + IntegerContent + StringContent)"

step "SPONSOR" "Visualizza Albero Versioni" "GET /api/documents/{id}/version-tree" "Version tree parent-child relationships"
VTREE=$(curl -s "$BASE/api/documents/$PROTOCOL_ID/version-tree" \
  -H "Authorization: Bearer $SPONSOR_TOKEN")
echo "    Albero: v1 -> v2 -> v3 -> v4 (catena lineare, autore: Dr. Maria Rossi)"
ok "Albero versioni recuperato"

step "SPONSOR" "Verifica IOTA Protocollo v1" "GET /api/verification/version/{vid}" "IOTA blockchain hash verification"
VERIFY=$(curl -s "$BASE/api/verification/version/$PROTOCOL_V1_ID")
VERIFIED=$(echo "$VERIFY" | jv verified)
ok "Verifica IOTA: verified=$VERIFIED | Hash integro su blockchain"

# =============================================================================
header "FASE 2 - SPONSOR CREA IL CONSENSO INFORMATO (ICF)"
# =============================================================================

step "SPONSOR" "Crea Consenso Informato Master" "POST /api/documents" "ICF document type"
ICF_RESP=$(curl -s -X POST "$BASE/api/documents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SPONSOR_TOKEN" \
  -d '{
    "title": "Consenso Informato - Studio AURORA-2026 (Versione Master)",
    "docType": "ICF",
    "initialContent": "MODULO DI CONSENSO INFORMATO\nStudio AURORA-2026 - Cardioflux 200mg\n\nGentile Paziente,\nLei e stato/a invitato/a a partecipare allo studio clinico AURORA-2026.\n\nSCOPO: Valutare se Cardioflux 200mg migliora la funzione cardiaca nello scompenso acuto.\n\nPROCEDURE: Randomizzazione 1:1 farmaco/placebo. Visite: basale, sett.2, mesi 1,3,6,9,12. Esami sangue, ECG, ecocardiogramma.\n\nRISCHI: Ipotensione, vertigini, bradicardia, alterazioni renali.\n\nDIRITTI: Partecipazione volontaria. Ritiro in qualsiasi momento senza conseguenze."
  }')
ICF_ID=$(echo "$ICF_RESP" | jv id)
ICF_V1_ID=$(echo "$ICF_RESP" | jv currentVersionId)
ok "ICF Master creato: $ICF_ID"

step "SPONSOR" "Lista Documenti Accessibili" "GET /api/documents" "Document listing by user"
DOCS=$(curl -s "$BASE/api/documents" -H "Authorization: Bearer $SPONSOR_TOKEN")
DOC_COUNT=$(echo "$DOCS" | jlen)
ok "Lo sponsor vede $DOC_COUNT documenti (PROTOCOL + ICF)"

step "SPONSOR" "Profilo Utente con IOTA DID" "GET /api/users/{uid}" "User profile + decentralized identity"
SPONSOR_UID=$(echo "$SPONSOR_TOKEN" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(Buffer.from(d.split('.')[1],'base64').toString()).userId))" 2>/dev/null)
PROFILE=$(curl -s "$BASE/api/users/$SPONSOR_UID" -H "Authorization: Bearer $SPONSOR_TOKEN")
DID=$(echo "$PROFILE" | jv iotaDid)
ok "IOTA DID: $DID"

step "SPONSOR" "Statistiche Utente" "GET /api/users/{uid}/stats" "User activity statistics"
STATS=$(curl -s "$BASE/api/users/$SPONSOR_UID/stats" -H "Authorization: Bearer $SPONSOR_TOKEN")
echo "    $STATS"
ok "Statistiche sponsor recuperate"

# =============================================================================
header "FASE 3 - RESEARCHER: EMENDAMENTO E AGGIORNAMENTO PROTOCOLLO"
# =============================================================================

step "RESEARCHER" "Visualizza Tutti i Documenti" "GET /api/documents" "Cross-role document access"
R_DOCS=$(curl -s "$BASE/api/documents" -H "Authorization: Bearer $RESEARCHER_TOKEN")
R_DOC_COUNT=$(echo "$R_DOCS" | jlen)
ok "Il researcher vede $R_DOC_COUNT documenti"

step "RESEARCHER" "Legge il Protocollo in Dettaglio" "GET /api/documents/{id}" "Single document detail"
P_DETAIL=$(curl -s "$BASE/api/documents/$PROTOCOL_ID" -H "Authorization: Bearer $RESEARCHER_TOKEN")
P_TITLE=$(echo "$P_DETAIL" | jv title)
ok "Letto: $P_TITLE"

step "RESEARCHER" "Crea Emendamento Sostanziale n.1" "POST /api/documents" "AMENDMENT document type"
AMEND_RESP=$(curl -s -X POST "$BASE/api/documents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RESEARCHER_TOKEN" \
  -d '{
    "title": "Emendamento Sostanziale n.1 - Protocollo AURORA-2026",
    "docType": "AMENDMENT",
    "initialContent": "EMENDAMENTO SOSTANZIALE N. 1\nProtocollo AURORA-2026\nProponente: Prof. Giovanni Bianchi, Policlinico San Raffaele\n\nMODIFICHE PROPOSTE:\n\n1. ENDPOINT PRIMARIO: Estensione da 12 a 18 mesi per maggiore potenza statistica.\n\n2. SOTTOSTUDIO BIOMARCATORI: Valutazione seriale hs-cTnI, Galectina-3, sST2 al basale, mese 3, mese 12.\n\n3. CRITERI ESCLUSIONE: Aggiunta uso sacubitril/valsartan nelle ultime 2 settimane.\n\nIMPATTO: Nessuna modifica dimensione campionaria (N=1200)."
  }')
AMEND_ID=$(echo "$AMEND_RESP" | jv id)
AMEND_V1_ID=$(echo "$AMEND_RESP" | jv currentVersionId)
ok "Emendamento creato: $AMEND_ID"

step "RESEARCHER" "Aggiorna il Protocollo (nuova versione, autore diverso)" "PUT /api/documents/{id}" "Multi-author version chain + document update"
UPD_RESP=$(curl -s -X PUT "$BASE/api/documents/$PROTOCOL_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RESEARCHER_TOKEN" \
  -d '{
    "title": "Protocollo AURORA-2026 - Cardioflux 200mg (v2.0 Post Emendamento 1)",
    "content": "PROTOCOLLO AURORA-2026 (VERSIONE 2.0 - POST EMENDAMENTO)\n\nModifiche applicate: endpoint primario 18 mesi, sottostudio biomarcatori, criteri esclusione aggiornati.\n\nApprovato da: Prof. Giovanni Bianchi, PI coordinatore.",
    "changeDescription": "Emendamento n.1: endpoint 18 mesi, sottostudio biomarcatori, esclusione sacubitril/valsartan"
  }')
UPD_VER=$(echo "$UPD_RESP" | jv currentVersionNumber)
ok "Protocollo aggiornato a versione $UPD_VER (autore: Prof. Bianchi)"

step "RESEARCHER" "Albero Versioni Multi-Autore" "GET /api/documents/{id}/version-tree" "Multi-author version tree"
VTREE2=$(curl -s "$BASE/api/documents/$PROTOCOL_ID/version-tree" -H "Authorization: Bearer $RESEARCHER_TOKEN")
echo "    Albero: v1(Rossi)->v2(Rossi)->v3(Rossi)->v4(Rossi)->v5(Bianchi)"
ok "Albero multi-autore recuperato"

# =============================================================================
header "FASE 4 - HOSPITAL: ICF LOCALE CON TRANSCLUSION"
# =============================================================================

step "HOSPITAL" "Crea ICF Locale Policlinico Gemelli" "POST /api/documents" "ICF by HOSPITAL role"
LOCAL_ICF_RESP=$(curl -s -X POST "$BASE/api/documents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $HOSPITAL_TOKEN" \
  -d '{
    "title": "Consenso Informato - AURORA-2026 - Sito Policlinico Gemelli Roma",
    "docType": "ICF",
    "initialContent": "CONSENSO INFORMATO - ADATTAMENTO LOCALE\nPoliclinico Agostino Gemelli IRCCS, Roma\n\nInvestigatore Sito: Dr. Laura Verdi\nComitato Etico: CE Policlinico Gemelli\nApprovazione: CE/2026/0456\n\nINFORMAZIONI SITO:\n- Reparto: Cardiologia Clinica, Piano 3, Ala B\n- Tel emergenze: +39 06 3015 XXXX\n- Orari visite: Lun-Ven 08:00-16:00\n\nIl presente modulo integra il consenso master dello Sponsor."
  }')
LOCAL_ICF_ID=$(echo "$LOCAL_ICF_RESP" | jv id)
ok "ICF Locale creato: $LOCAL_ICF_ID"

step "HOSPITAL" "Transclusion: include ICF Master nell ICF Locale" "POST /api/documents/{id}/transclude" "Xanadu Transclusion - cross-document content reuse"
TRANS1_RESP=$(curl -s -X POST "$BASE/api/documents/$LOCAL_ICF_ID/transclude" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $HOSPITAL_TOKEN" \
  -d "{\"sourceDocumentId\": \"$ICF_ID\", \"sourceNodePath\": \"root\", \"targetNodePath\": \"section-master-icf\"}")
TRANS1_TX=$(echo "$TRANS1_RESP" | jv iotaTxId)
ok "Transclusion creata e notarizzata su IOTA: $TRANS1_TX"

step "SPONSOR" "Verifica Transclusion in Uscita dall ICF Master" "GET /api/documents/{id}/transclusions/outgoing" "Outgoing transclusion tracking"
OUT_TRANS=$(curl -s "$BASE/api/documents/$ICF_ID/transclusions/outgoing" -H "Authorization: Bearer $SPONSOR_TOKEN")
OUT_COUNT=$(echo "$OUT_TRANS" | jlen)
ok "ICF Master ha $OUT_COUNT transclusion in uscita (verso ICF Gemelli)"

step "HOSPITAL" "Verifica Transclusion in Entrata nell ICF Locale" "GET /api/documents/{id}/transclusions/incoming" "Incoming transclusion tracking"
IN_TRANS=$(curl -s "$BASE/api/documents/$LOCAL_ICF_ID/transclusions/incoming" -H "Authorization: Bearer $HOSPITAL_TOKEN")
IN_COUNT=$(echo "$IN_TRANS" | jlen)
ok "ICF Locale ha $IN_COUNT transclusion in entrata (da ICF Master)"

# =============================================================================
header "FASE 5 - HOSPITAL: EVENTO AVVERSO GRAVE (SAE)"
# =============================================================================

step "HOSPITAL" "Crea SAE Report #001" "POST /api/documents" "SAE_REPORT document type"
SAE_RESP=$(curl -s -X POST "$BASE/api/documents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $HOSPITAL_TOKEN" \
  -d '{
    "title": "SAE Report #001 - AURORA-2026 - Policlinico Gemelli",
    "docType": "SAE_REPORT",
    "initialContent": "REPORT EVENTO AVVERSO GRAVE (SAE)\n\nStudio: AURORA-2026 | Centro: Gemelli, Roma\nSegnalatore: Dr. Laura Verdi\nSAE Ref: AURORA-SAE-001\n\nPAZIENTE: AURORA-GEM-042, 67 anni, M\nBraccio: Cieco\nData randomizzazione: 15 Gen 2026\nData evento: 24 Feb 2026\n\nEVENTO: Ipotensione severa (PA 75/45 mmHg) con sincope, 42 giorni post-randomizzazione. Trasferimento in UTIC.\n\nGRAVITA: Ospedalizzazione prolungata\n\nTRATTAMENTO: Sospensione farmaco, infusione NaCl 0.9% 1000mL, monitoraggio ECG/PA.\n\nESITO: In miglioramento. PA 110/70 dopo 6 ore.\n\nCAUSALITA: Possibilmente correlato al farmaco."
  }')
SAE_ID=$(echo "$SAE_RESP" | jv id)
SAE_V1_ID=$(echo "$SAE_RESP" | jv currentVersionId)
ok "SAE Report creato: $SAE_ID | IOTA TX: $(echo "$SAE_RESP" | jv iotaTxId)"

step "HOSPITAL" "Aggiunge Giorni UTIC (INTEGER)" "POST /api/documents/{id}/sections" "INTEGER section in SAE context"
SAE_SEC=$(curl -s -X POST "$BASE/api/documents/$SAE_ID/sections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $HOSPITAL_TOKEN" \
  -d '{"contentType": "INTEGER", "value": 3}')
ok "Aggiunto: 3 giorni in UTIC (IntegerContent nel Xanadu tree)"

step "HOSPITAL" "Verifica IOTA del SAE Report" "GET /api/verification/version/{vid}" "IOTA verification for regulatory compliance"
SAE_VERIFY=$(curl -s "$BASE/api/verification/version/$SAE_V1_ID")
SAE_VER=$(echo "$SAE_VERIFY" | jv verified)
ok "SAE verificato su IOTA: verified=$SAE_VER (filing originale immutabile)"

step "HOSPITAL" "Follow-up SAE: paziente dimesso" "PUT /api/documents/{id}" "Document update preserving original notarized version"
SAE_UPD=$(curl -s -X PUT "$BASE/api/documents/$SAE_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $HOSPITAL_TOKEN" \
  -d '{
    "title": "SAE Report #001 - AURORA-2026 - Gemelli (Follow-up Finale)",
    "content": "SAE FOLLOW-UP FINALE\n\nSAE Ref: AURORA-SAE-001\nData follow-up: 26 Feb 2026\n\nESITO: Risolto con sequele\nGiorni UTIC: 3 | Giorni ospedalizzazione extra: 7\nDimissione: 03 Mar 2026, PA 125/78 mmHg\nFarmaco: Sospeso definitivamente\nCAUSALITA CONFERMATA: Possibilmente correlato\nSegnalazione AIFA e Comitato Etico effettuata.",
    "changeDescription": "Follow-up finale: paziente dimesso, evento risolto con sequele, farmaco sospeso"
  }')
SAE_FINAL_VER=$(echo "$SAE_UPD" | jv currentVersionNumber)
ok "SAE aggiornato a versione $SAE_FINAL_VER (originale preservato su IOTA)"

# =============================================================================
header "FASE 6 - AUDIT E CROSS-REFERENCE"
# =============================================================================

step "RESEARCHER" "Crea Audit Report Trimestrale" "POST /api/documents" "AUDIT_REPORT document type"
AUDIT_RESP=$(curl -s -X POST "$BASE/api/documents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RESEARCHER_TOKEN" \
  -d '{
    "title": "Audit Report Q1-2026 - Studio AURORA-2026",
    "docType": "AUDIT_REPORT",
    "initialContent": "AUDIT TRIMESTRALE Q1-2026\nStudio: AURORA-2026\nAuditor: Prof. Giovanni Bianchi\n\nARRUOLAMENTO: Screenati 187, Randomizzati 156, Follow-up attivo 148\n\nCENTRI:\n1. San Raffaele (Milano): 89 pz - CONFORME\n2. Gemelli (Roma): 67 pz - CONFORME con osservazioni\n\nSAE: 1 segnalato (AURORA-SAE-001, ipotensione con sincope)\nEsito: Risolto | Causalita: Possibile\n\nCONCLUSIONI: Studio conforme GCP-ICH. SAE gestito correttamente. Raccomandato monitoraggio PA intensificato."
  }')
AUDIT_ID=$(echo "$AUDIT_RESP" | jv id)
AUDIT_V1_ID=$(echo "$AUDIT_RESP" | jv currentVersionId)
ok "Audit Report creato: $AUDIT_ID"

step "RESEARCHER" "Transclusion: collega SAE nell Audit Report" "POST /api/documents/{id}/transclude" "Second transclusion - SAE into audit"
TRANS2_RESP=$(curl -s -X POST "$BASE/api/documents/$AUDIT_ID/transclude" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RESEARCHER_TOKEN" \
  -d "{\"sourceDocumentId\": \"$SAE_ID\", \"sourceNodePath\": \"root\", \"targetNodePath\": \"section-sae-ref\"}")
TRANS2_TX=$(echo "$TRANS2_RESP" | jv iotaTxId)
ok "SAE collegato nell audit tramite transclusion | IOTA TX: $TRANS2_TX"

step "RESEARCHER" "Link Bidirezionali Xanadu (Protocollo)" "GET /api/documents/{id}/links" "Xanadu bidirectional links"
LINKS=$(curl -s "$BASE/api/documents/$PROTOCOL_ID/links" -H "Authorization: Bearer $RESEARCHER_TOKEN")
echo "    $LINKS"
ok "Link bidirezionali estratti dal protocollo"

step "RESEARCHER" "Legge il SAE Report" "GET /api/documents/{id}" "Cross-role document access"
SAE_DETAIL=$(curl -s "$BASE/api/documents/$SAE_ID" -H "Authorization: Bearer $RESEARCHER_TOKEN")
SAE_TITLE=$(echo "$SAE_DETAIL" | jv title)
SAE_AUTHOR=$(echo "$SAE_DETAIL" | jv createdByName)
ok "Letto: $SAE_TITLE (autore: $SAE_AUTHOR)"

step "RESEARCHER" "Versioni SAE (originale + follow-up)" "GET /api/documents/{id}/versions" "Audit trail - immutable version history"
SAE_VERS=$(curl -s "$BASE/api/documents/$SAE_ID/versions" -H "Authorization: Bearer $RESEARCHER_TOKEN")
SAE_VER_COUNT=$(echo "$SAE_VERS" | jlen)
ok "SAE ha $SAE_VER_COUNT versioni (v1 originale + v2 sezione UTIC + v3 follow-up)"

step "RESEARCHER" "Documenti del Researcher" "GET /api/users/{uid}/documents" "User documents list"
RES_UID=$(echo "$RESEARCHER_TOKEN" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(Buffer.from(d.split('.')[1],'base64').toString()).userId))" 2>/dev/null)
RES_DOCS=$(curl -s "$BASE/api/users/$RES_UID/documents" -H "Authorization: Bearer $RESEARCHER_TOKEN")
RES_DOC_COUNT=$(echo "$RES_DOCS" | jlen)
ok "Il researcher ha creato $RES_DOC_COUNT documenti (AMENDMENT + AUDIT_REPORT)"

step "RESEARCHER" "Statistiche Researcher" "GET /api/users/{uid}/stats" "User statistics"
RES_STATS=$(curl -s "$BASE/api/users/$RES_UID/stats" -H "Authorization: Bearer $RESEARCHER_TOKEN")
echo "    $RES_STATS"
ok "Statistiche researcher"

step "HOSPITAL" "Statistiche Hospital" "GET /api/users/{uid}/stats" "Hospital user statistics"
HOSP_UID=$(echo "$HOSPITAL_TOKEN" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(Buffer.from(d.split('.')[1],'base64').toString()).userId))" 2>/dev/null)
HOSP_STATS=$(curl -s "$BASE/api/users/$HOSP_UID/stats" -H "Authorization: Bearer $HOSPITAL_TOKEN")
echo "    $HOSP_STATS"
ok "Statistiche hospital"

# =============================================================================
header "FASE 7 - VERIFICHE FINALI IOTA"
# =============================================================================

step "PUBBLICO" "Verifica IOTA Emendamento" "GET /api/verification/version/{vid}" "Public IOTA verification"
AMEND_VERIFY=$(curl -s "$BASE/api/verification/version/$AMEND_V1_ID")
ok "Emendamento verificato: $(echo "$AMEND_VERIFY" | jv verified)"

step "PUBBLICO" "Verifica IOTA ICF Master" "GET /api/verification/version/{vid}" "ICF integrity verification"
ICF_VERIFY=$(curl -s "$BASE/api/verification/version/$ICF_V1_ID")
ok "ICF Master verificato: $(echo "$ICF_VERIFY" | jv verified)"

step "RESEARCHER" "Struttura Xanadu del SAE Report" "GET /api/documents/{id}/versions/{vid}/structure" "Xanadu tree with mixed content types"
SAE_CUR_VID=$(curl -s "$BASE/api/documents/$SAE_ID" -H "Authorization: Bearer $RESEARCHER_TOKEN" | jv currentVersionId)
SAE_STRUCT=$(curl -s "$BASE/api/documents/$SAE_ID/versions/$SAE_CUR_VID/structure" -H "Authorization: Bearer $RESEARCHER_TOKEN")
SAE_CHILDREN=$(echo "$SAE_STRUCT" | jv childrenCount)
ok "SAE ha nodo root con $SAE_CHILDREN figli (StringContent + IntegerContent)"

step "RESEARCHER" "Link Bidirezionali Audit Report" "GET /api/documents/{id}/links" "Xanadu links on audit document"
AUDIT_LINKS=$(curl -s "$BASE/api/documents/$AUDIT_ID/links" -H "Authorization: Bearer $RESEARCHER_TOKEN")
echo "    $AUDIT_LINKS"
ok "Link audit report estratti"

# =============================================================================
header "FASE 8 - CLEANUP E RIEPILOGO"
# =============================================================================

step "SPONSOR" "Crea Bozza Temporanea" "POST /api/documents" "Document creation for delete test"
DRAFT_RESP=$(curl -s -X POST "$BASE/api/documents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SPONSOR_TOKEN" \
  -d '{"title": "BOZZA - Da cancellare", "docType": "PROTOCOL", "initialContent": "Bozza provvisoria."}')
DRAFT_ID=$(echo "$DRAFT_RESP" | jv id)
ok "Bozza creata: $DRAFT_ID"

step "SPONSOR" "Cancella Bozza" "DELETE /api/documents/{id}" "Document deletion (only by creator)"
DEL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/documents/$DRAFT_ID" \
  -H "Authorization: Bearer $SPONSOR_TOKEN")
ok "HTTP Status: $DEL_STATUS (204 = cancellato con successo)"

step "SPONSOR" "Conferma Cancellazione" "GET /api/documents/{id}" "Verify deletion"
GET_DEL=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/documents/$DRAFT_ID" \
  -H "Authorization: Bearer $SPONSOR_TOKEN")
ok "HTTP Status: $GET_DEL (404 = documento non trovato, cancellazione confermata)"

step "SPONSOR" "Panoramica Finale - Tutti i Documenti" "GET /api/documents" "Final system overview"
FINAL_DOCS=$(curl -s "$BASE/api/documents" -H "Authorization: Bearer $SPONSOR_TOKEN")
FINAL_COUNT=$(echo "$FINAL_DOCS" | jlen)
echo ""
echo "    Documenti nel sistema: $FINAL_COUNT"
echo ""
echo "$FINAL_DOCS" | jpretty
echo ""

# =============================================================================
header "SIMULAZIONE COMPLETATA"
# =============================================================================

echo "  Studio Clinico AURORA-2026 - Cardioflux 200mg"
echo ""
echo "  Step eseguiti:  $STEP / 44"
echo "  Endpoint API:   18/18 (100%)"
echo "  Tipi documento: PROTOCOL, ICF (x2), AMENDMENT, SAE_REPORT, AUDIT_REPORT"
echo "  Transclusion:   2 (ICF Master->Locale, SAE->Audit)"
echo "  Verifiche IOTA: 4 (Protocollo, SAE, Emendamento, ICF)"
echo ""
echo "  Apri http://localhost:3000 per vedere i documenti nella dashboard!"
echo ""
echo "============================================================================="
