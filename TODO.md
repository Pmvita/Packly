# ✅ Packly — TODO (v2)

**Spec version:** 2.0 — 2026-09-18

v1 on GitHub is the capture dashboard. v2 in this folder adds the **analyst output** the Security resume claims: a diagnostic report from decoded packets, and a path that works on Windows without Npcap.

**Locked scope:**

- Keep mock capture as the default demo
- Report: protocol counts, port-spread, RST burst, SYN volume
- Do not require live libpcap for tests
- Do not add auth, Grafana, or a second database

---

- [x] Clone v1 into `4) Security/Packly`
- [x] `src/report/diagnostic.ts` + unit tests
- [x] Wire “Export report” on the live dashboard (markdown download)
- [x] Sample PCAP playback (file in, packets out)
- [x] Windows README note: mock capture first, Npcap optional
- [x] `cap` is optional — `npm install` succeeds without Python/Npcap
