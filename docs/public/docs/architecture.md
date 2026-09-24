# Llemu — Project Architecture

```
llemu/
│
├── core/
│   ├── runtime/
│   ├── registry/
│   └── supervisor/
│
├── services/
│   │
│   ├── identity/
│   │   ├── cmd/
│   │   ├── internal/
│   │   ├── database/
│   │   ├── migrations/
│   │   ├── manifest/
│   │   ├── contracts/
│   │   ├── openapi/
│   │   ├── docs/
│   │   ├── blueprint/
│   │   ├── tests/
│   │   └── demo/
│   │
│   ├── iam/
│   │   ├── cmd/
│   │   ├── internal/
│   │   ├── database/
│   │   ├── migrations/
│   │   ├── manifest/
│   │   ├── contracts/
│   │   ├── openapi/
│   │   ├── docs/
│   │   ├── blueprint/
│   │   ├── tests/
│   │   └── demo/
│   │
│   ├── policy/
│   ├── billing/
│   └── notification/
│
├── plugins/
│   │
│   ├── canvas/
│   ├── image/
│   ├── gallery/
│   ├── creative-guide/
│   ├── command-hub/
│   ├── video/
│   ├── audio/
│   └── three-d/
│
├── packages/
│   │
│   ├── contracts/
│   ├── events/
│   ├── schemas/
│   ├── generators/
│   └── sdk/
│
├── apps/
│   └── web/
│
├── infrastructure/
│   ├── nats/
│   ├── storage/
│   ├── observability/
│   └── deployment/
│
├── tools/
│   ├── contract-generator/
│   ├── manifest-validator/
│   ├── service-generator/
│   └── plugin-generator/
│
└── docs/
    ├── architecture/
    ├── standards/
    └── adr/
```

---

## ساختار استاندارد هر Service

تمامی Service‌ها باید دقیقاً از یک الگوی مشخص پیروی کنند:

```
service/
│
├── cmd/
│
├── internal/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── transport/
│
├── database/
│
├── migrations/
│
├── manifest/
│   └── manifest.yaml
│
├── contracts/
│
├── openapi/
│   └── openapi.yaml
│
├── docs/
│
├── blueprint/
│   └── README.md
│
├── tests/
│
├── demo/
│
└── README.md