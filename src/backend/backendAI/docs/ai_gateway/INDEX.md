# AI Gateway Documentation

## 📚 Available Documents

### 1. README.md
**Overview và Architecture**
- Purpose của AI Gateway
- High-level architecture
- Service responsibilities
- Quick start guide

### 2. API_DOCUMENTATION.md
**Complete API Reference**
- All API endpoints
- Request/Response examples
- Error handling
- Authentication (nếu có)

### 3. ARCHITECTURE_DIAGRAM.md
**Detailed Architecture Diagrams**
- System design
- Data flow
- Component interactions
- Sequence diagrams

### 4. QUICKSTART.md
**Quick Start Guide**
- 5-minute setup
- Example requests
- Testing guide

### 5. SUMMARY.md
**Executive Summary**
- Key features
- Technical stack
- Performance metrics

---

## 🎯 Start Here

**New to AI Gateway?**
1. Read **README.md** for overview
2. Check **QUICKSTART.md** to get started
3. Use **API_DOCUMENTATION.md** as reference

**Want to understand architecture?**
1. Read **ARCHITECTURE_DIAGRAM.md**
2. Review **SUMMARY.md** for high-level view

---

## 🔗 Related Documentation

- **Main README**: `../../README.md` - Backend AI overview
- **Stateless Architecture**: `../NO_DATABASE_ARCHITECTURE.md`
- **Testing Guide**: `../TESTING_GUIDE.md`

---

## 📝 Document Status

| Document | Lines | Status | Last Updated |
|----------|-------|--------|--------------|
| README.md | 487 | ✅ Current | Oct 2025 |
| API_DOCUMENTATION.md | 558 | ✅ Current | Oct 2025 |
| ARCHITECTURE_DIAGRAM.md | 468 | ✅ Current | Oct 2025 |
| QUICKSTART.md | 349 | ✅ Current | Oct 2025 |
| SUMMARY.md | 508 | ✅ Current | Oct 2025 |

---

## 🎨 AI Gateway Overview

AI Gateway là **orchestration layer** cho tất cả AI services:

```
┌─────────────────────────────────────────┐
│         Frontend Request                │
│  "Generate a beautiful sunset"          │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│          AI Gateway                     │
│  • Intent Classification                │
│  • Prompt Refinement                    │
│  • Service Routing                      │
│  • Response Formatting                  │
└───────────────┬─────────────────────────┘
                │
    ┌───────────┼───────────┐
    ▼           ▼           ▼
┌────────┐ ┌────────┐ ┌──────────┐
│ Image  │ │ Face   │ │ BG       │
│ Gen    │ │ Swap   │ │ Removal  │
└────────┘ └────────┘ └──────────┘
```

---

**For more details, see individual documents above.**
