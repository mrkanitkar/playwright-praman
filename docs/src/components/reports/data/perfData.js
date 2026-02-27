export const PERF_DATA = {
  processes: [
    {
      id: "O2C", name: "Order to Cash", icon: "\u{1F4B3}", status: "excellent",
      e2eTime: 38.7, txnCount: 6, avgMemory: 134, avgCpu: 31, avgNetwork: 76, successRate: 100,
      transactions: [
        { tcode: "VA01", name: "Create Sales Order", avgTime: 2.8, p95Time: 4.1, sla: 5, eccBaseline: 3.2, trend: "improving", samples: 1240, memory: 98, cpu: 22, network: 68 },
        { tcode: "VA02", name: "Change Sales Order", avgTime: 1.9, p95Time: 3.0, sla: 4, eccBaseline: 2.1, trend: "stable", samples: 890, memory: 82, cpu: 18, network: 65 },
        { tcode: "VL01N", name: "Create Delivery", avgTime: 3.5, p95Time: 5.8, sla: 5, eccBaseline: 3.0, trend: "degrading", samples: 760, memory: 124, cpu: 28, network: 72 },
        { tcode: "VL02N", name: "Change Delivery", avgTime: 2.1, p95Time: 3.2, sla: 4, eccBaseline: 2.0, trend: "stable", samples: 620, memory: 95, cpu: 20, network: 70 },
        { tcode: "VF01", name: "Create Billing Doc", avgTime: 4.2, p95Time: 7.1, sla: 6, eccBaseline: 3.8, trend: "degrading", samples: 540, memory: 156, cpu: 38, network: 82 },
        { tcode: "VKM1", name: "Credit Management", avgTime: 1.4, p95Time: 2.2, sla: 3, eccBaseline: 1.8, trend: "improving", samples: 320, memory: 76, cpu: 15, network: 58 },
      ],
      optimizations: [
        { severity: "warning", text: "VL01N Delivery: 3.5s response \u2014 optimize route determination and availability check" },
        { severity: "warning", text: "VF01 Billing: 4.2s with P95 at 7.1s \u2014 pricing procedure needs performance tuning" },
        { severity: "info", text: "Credit Management: 1.4s \u2014 consider async processing for real-time checks adding 0.8s overhead" },
      ],
    },
    {
      id: "P2P", name: "Procure to Pay", icon: "\u{1F4B0}", status: "optimized",
      e2eTime: 45.2, txnCount: 5, avgMemory: 147, avgCpu: 28, avgNetwork: 89, successRate: 100,
      transactions: [
        { tcode: "ME21N", name: "Create Purchase Order", avgTime: 3.1, p95Time: 4.8, sla: 5, eccBaseline: 3.5, trend: "improving", samples: 980, memory: 118, cpu: 26, network: 82 },
        { tcode: "ME22N", name: "Change Purchase Order", avgTime: 2.0, p95Time: 3.1, sla: 4, eccBaseline: 2.2, trend: "stable", samples: 720, memory: 92, cpu: 19, network: 78 },
        { tcode: "MIGO", name: "Goods Receipt", avgTime: 3.8, p95Time: 6.2, sla: 5, eccBaseline: 3.2, trend: "degrading", samples: 1100, memory: 142, cpu: 30, network: 88 },
        { tcode: "MIRO", name: "Invoice Verification", avgTime: 4.5, p95Time: 7.8, sla: 6, eccBaseline: 4.0, trend: "degrading", samples: 860, memory: 178, cpu: 35, network: 95 },
        { tcode: "ME51N", name: "Create Purchase Req", avgTime: 2.2, p95Time: 3.4, sla: 4, eccBaseline: 2.5, trend: "improving", samples: 1450, memory: 88, cpu: 18, network: 72 },
      ],
      optimizations: [
        { severity: "warning", text: "MIRO Invoice Verification: 4.5s avg, P95 at 7.8s \u2014 three-way matching logic needs tuning" },
        { severity: "warning", text: "MIGO Goods Receipt: degrading trend at 3.8s \u2014 implement master data caching" },
        { severity: "info", text: "Integration layer consuming 18s \u2014 implement Redis caching for vendor/material lookups" },
      ],
    },
    {
      id: "R2R", name: "Record to Report", icon: "\u{1F4C5}", status: "critical",
      e2eTime: 62.1, txnCount: 5, avgMemory: 189, avgCpu: 45, avgNetwork: 124, successRate: 100,
      transactions: [
        { tcode: "FB01", name: "Post Document", avgTime: 1.8, p95Time: 2.9, sla: 3, eccBaseline: 1.6, trend: "stable", samples: 2200, memory: 89, cpu: 15, network: 45 },
        { tcode: "FB50", name: "GL Account Posting", avgTime: 1.5, p95Time: 2.4, sla: 3, eccBaseline: 1.4, trend: "stable", samples: 1800, memory: 82, cpu: 14, network: 42 },
        { tcode: "F-02", name: "Enter Header Data", avgTime: 1.2, p95Time: 1.9, sla: 3, eccBaseline: 1.3, trend: "improving", samples: 950, memory: 76, cpu: 12, network: 38 },
        { tcode: "FAGL_FC_VAL", name: "Foreign Currency Val", avgTime: 45.2, p95Time: 62.0, sla: 60, eccBaseline: 38.0, trend: "degrading", samples: 24, memory: 234, cpu: 52, network: 145 },
        { tcode: "AFAB", name: "Depreciation Run", avgTime: 128.5, p95Time: 155.0, sla: 180, eccBaseline: 95.0, trend: "degrading", samples: 12, memory: 312, cpu: 68, network: 168 },
      ],
      optimizations: [
        { severity: "critical", text: "FAGL_FC_VAL: 45.2s avg with P95 at 62.0s exceeding 60s SLA \u2014 optimize multi-currency revaluation logic" },
        { severity: "critical", text: "AFAB Depreciation: 128.5s with degrading trend \u2014 35% slower than ECC baseline" },
        { severity: "warning", text: "Period close memory: 189MB peak (target: 150MB) \u2014 implement data streaming for large datasets" },
        { severity: "warning", text: "CPU utilization: 45% during close (target: <30%) \u2014 move heavy operations to background" },
      ],
    },
    {
      id: "P2D", name: "Plan to Deliver", icon: "\u{1F3ED}", status: "warning",
      e2eTime: 48.5, txnCount: 4, avgMemory: 156, avgCpu: 34, avgNetwork: 95, successRate: 100,
      transactions: [
        { tcode: "MD01", name: "MRP Run (Total)", avgTime: 2340, p95Time: 2820, sla: 2700, eccBaseline: 1800, trend: "degrading", samples: 8, memory: 456, cpu: 78, network: 210 },
        { tcode: "CO01", name: "Create Process Order", avgTime: 3.2, p95Time: 4.8, sla: 5, eccBaseline: 2.8, trend: "stable", samples: 640, memory: 112, cpu: 24, network: 76 },
        { tcode: "CO11N", name: "Order Confirmation", avgTime: 2.5, p95Time: 3.9, sla: 4, eccBaseline: 2.2, trend: "stable", samples: 1520, memory: 96, cpu: 21, network: 72 },
        { tcode: "MFBF", name: "Backflush", avgTime: 3.8, p95Time: 5.5, sla: 5, eccBaseline: 3.0, trend: "degrading", samples: 780, memory: 138, cpu: 29, network: 85 },
      ],
      optimizations: [
        { severity: "critical", text: "MD01 MRP Run: 39min avg, P95 at 47min \u2014 approaching 45min SLA, 30% slower than ECC" },
        { severity: "warning", text: "MFBF Backflush: degrading at 3.8s with P95 breaching 5s SLA \u2014 optimize batch split logic" },
        { severity: "info", text: "MRP memory: 456MB peak \u2014 consider partitioned MRP runs by plant" },
      ],
    },
    {
      id: "H2R", name: "Hire to Retire", icon: "\u{1F465}", status: "good",
      e2eTime: 29.8, txnCount: 3, avgMemory: 112, avgCpu: 24, avgNetwork: 67, successRate: 100,
      transactions: [
        { tcode: "PA20", name: "Display HR Master", avgTime: 1.1, p95Time: 1.8, sla: 3, eccBaseline: 1.0, trend: "stable", samples: 3200, memory: 72, cpu: 10, network: 42 },
        { tcode: "PA30", name: "Maintain HR Master", avgTime: 2.4, p95Time: 3.6, sla: 4, eccBaseline: 2.2, trend: "stable", samples: 1600, memory: 98, cpu: 18, network: 58 },
        { tcode: "PC00", name: "Payroll Run", avgTime: 1850, p95Time: 2100, sla: 2400, eccBaseline: 1500, trend: "degrading", samples: 6, memory: 389, cpu: 62, network: 185 },
      ],
      optimizations: [
        { severity: "warning", text: "PC00 Payroll: 31min avg, 23% slower than ECC \u2014 wage type calculation overhead from new structure" },
        { severity: "info", text: "PA30 stable at 2.4s \u2014 well within SLA headroom" },
      ],
    },
    {
      id: "WM", name: "Warehouse Mgmt", icon: "\u{1F4E6}", status: "good",
      e2eTime: 22.4, txnCount: 3, avgMemory: 98, avgCpu: 20, avgNetwork: 58, successRate: 100,
      transactions: [
        { tcode: "/SCWM/PRDO", name: "Production Supply", avgTime: 2.8, p95Time: 4.2, sla: 5, eccBaseline: null, trend: "stable", samples: 420, memory: 108, cpu: 22, network: 62 },
        { tcode: "/SCWM/MON", name: "Warehouse Monitor", avgTime: 1.5, p95Time: 2.3, sla: 3, eccBaseline: null, trend: "improving", samples: 2800, memory: 86, cpu: 16, network: 48 },
        { tcode: "/SCWM/PACK", name: "Packing", avgTime: 3.2, p95Time: 4.9, sla: 5, eccBaseline: null, trend: "stable", samples: 680, memory: 118, cpu: 25, network: 68 },
      ],
      optimizations: [
        { severity: "info", text: "/SCWM/MON improving trend at 1.5s \u2014 good candidate for mobile device optimization" },
      ],
    },
  ],
  batchJobs: [
    { name: "MRP Total Planning Run", process: "P2D", s4Time: 39, eccTime: 30, sla: 45, unit: "min", status: "warning", memory: 456, cpu: 78 },
    { name: "Payroll Run (All Employees)", process: "H2R", s4Time: 31, eccTime: 25, sla: 40, unit: "min", status: "good", memory: 389, cpu: 62 },
    { name: "Depreciation Run", process: "R2R", s4Time: 2.1, eccTime: 1.6, sla: 3, unit: "min", status: "good", memory: 312, cpu: 68 },
    { name: "Foreign Currency Revaluation", process: "R2R", s4Time: 1.0, eccTime: 0.6, sla: 1, unit: "min", status: "critical", memory: 234, cpu: 52 },
    { name: "Billing Due List (VF04)", process: "O2C", s4Time: 18, eccTime: 14, sla: 20, unit: "min", status: "warning", memory: 198, cpu: 42 },
    { name: "Payment Run (F110)", process: "P2P", s4Time: 22, eccTime: 18, sla: 30, unit: "min", status: "good", memory: 167, cpu: 35 },
    { name: "Goods Movement Posting (Batch)", process: "P2P", s4Time: 12, eccTime: 10, sla: 15, unit: "min", status: "good", memory: 142, cpu: 28 },
    { name: "Month-End Close Sequence", process: "R2R", s4Time: 4.2, eccTime: 3.5, sla: 5, unit: "hrs", status: "warning", memory: 512, cpu: 72 },
  ],
  targets: { responseTime: 5, memory: 150, cpu: 30, successRate: 99.9 },
};
