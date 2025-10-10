# In-App Banner Message for v0.6.0 Release

## Banner Text (English)

### Primary Banner (Questionnaire Pages)

**Title:** Questionnaires Now English-Only
**Message:** To help us deliver features faster, questionnaires are temporarily English-only. Bilingual support will return in a future update. [Learn more](#)
**Type:** Info
**Dismissible:** Yes
**Duration:** Show for 30 days after v0.6.0 release

---

### Secondary Banner (Question Builder)

**Title:** Simplified Question Builder
**Message:** We've streamlined the question creation process! Questions are now in English only to speed up development. French support coming soon.
**Type:** Info
**Dismissible:** Yes
**Duration:** Show until user creates first questionnaire

---

## Banner Text (French)

### Primary Banner (Questionnaire Pages)

**Title:** Questionnaires uniquement en anglais
**Message:** Pour nous permettre de livrer les fonctionnalités plus rapidement, les questionnaires sont temporairement en anglais uniquement. Le support bilingue reviendra dans une prochaine mise à jour. [En savoir plus](#)
**Type:** Info
**Dismissible:** Yes
**Duration:** Show for 30 days after v0.6.0 release

---

### Secondary Banner (Question Builder)

**Title:** Création de questions simplifiée
**Message:** Nous avons simplifié le processus de création de questions ! Les questions sont maintenant en anglais uniquement pour accélérer le développement. Le support du français arrive bientôt.
**Type:** Info
**Dismissible:** Yes
**Duration:** Show until user creates first questionnaire

---

## Implementation Guidelines

### Banner Placement

1. **Questionnaire List Page** (`/research/questionnaires`)
   - Show primary banner at top of page
   - Display above questionnaire table

2. **Questionnaire Create Page** (`/research/questionnaires/new`)
   - Show secondary banner at top of form
   - Display below page title, above question builder

3. **Questionnaire Edit Page** (`/research/questionnaires/[id]/edit`)
   - Show secondary banner for new questionnaires only
   - Hide for existing bilingual questionnaires

### Banner Styling

```tsx
// Example implementation using Shadcn UI Alert component
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

<Alert className="mb-4 border-blue-200 bg-blue-50">
  <Info className="h-4 w-4 text-blue-600" />
  <AlertTitle className="text-blue-900">Questionnaires Now English-Only</AlertTitle>
  <AlertDescription className="text-blue-800">
    To help us deliver features faster, questionnaires are temporarily English-only.
    Bilingual support will return in a future update.{" "}
    <a href="/docs/prd/PRD-008" className="underline font-medium">
      Learn more
    </a>
  </AlertDescription>
</Alert>
```

### Dismissal Logic

- Store dismissal state in localStorage: `banner:v0.6.0:questionnaire-english-only`
- Respect user preference across sessions
- Reset dismissal after 30 days or on new releases

### A/B Testing Considerations

Consider testing different banner messages:

**Variant A (Current):** "To help us deliver features faster..."
**Variant B (Empathetic):** "We hear you! We're temporarily focusing on English to ship faster. French coming soon."
**Variant C (Direct):** "New: English-only questionnaires for faster development. Phase 2: Full bilingual support."

Track metrics:
- Click-through rate on "Learn more" link
- Banner dismissal rate
- Time spent reading banner
- User satisfaction after seeing banner

---

## FAQs (Linked from Banner)

### Q: Why English-only?
**A:** To accelerate MVP development and gather user feedback faster. Bilingual support adds ~30% development time per feature. We're prioritizing core functionality first.

### Q: When will French support return?
**A:** Phase 2 is planned for v0.8.0 (approximately 3 months after v0.6.0 launch). Timeline depends on user feedback and demand.

### Q: What about existing bilingual questionnaires?
**A:** They still work! Existing questionnaires will display English text. French translations are preserved in our database.

### Q: Can I still use French in my questionnaires?
**A:** Not in the new format. However, you can write questions in English and participants can respond in any language (for text questions).

### Q: Will this affect responses to existing questionnaires?
**A:** No. Users can still respond to all questionnaires (old and new). Only the creation process has changed.

### Q: What if I need bilingual questionnaires urgently?
**A:** Contact the Product team. We can prioritize Phase 2 development based on business needs.

---

## Communication Timeline

### Pre-Release (1 week before v0.6.0)
- Slack announcement to research team
- Email to all RESEARCHER role users
- Demo session showing new simplified UI

### Release Day (v0.6.0 launch)
- Deploy banner to production
- Monitor support tickets
- Track banner interactions

### Post-Release (2 weeks after v0.6.0)
- Survey researchers: "How do you feel about English-only questionnaires?"
- Collect feedback on missing French support
- Adjust Phase 2 timeline based on demand

### Phase 2 Planning (3 months after v0.6.0)
- Evaluate user feedback
- Decide on reintroduction approach (opt-in vs. required)
- Design new bilingual workflow

---

## Success Metrics

Track these metrics to validate the decision:

1. **Banner Engagement**
   - Click-through rate on "Learn more": Target >15%
   - Dismissal rate: Target <50% (users read the message)
   - Time to dismissal: Target >5 seconds (users actually read it)

2. **User Sentiment**
   - Support tickets about missing French: Target <10 in first month
   - User satisfaction survey: Target "satisfied" or "neutral" from 90%+ of researchers
   - Feature requests for bilingual support: Track volume

3. **Adoption Metrics**
   - Questionnaire creation rate: Target 15%+ increase (simpler UI = more usage)
   - Time to create questionnaire: Target 50% reduction (5min → 2.5min)
   - Validation errors: Target 20% reduction (simpler validation)

4. **Development Velocity**
   - Feature delivery speed: Measure actual 30% improvement
   - Bug count: Track any increase due to simplified code
   - Code complexity: Measure LOC reduction

---

## Rollback Plan

If user sentiment is overwhelmingly negative (>30% of researchers complain):

1. **Immediate (within 48 hours)**
   - Update banner message to acknowledge concerns
   - Provide temporary workarounds

2. **Short-term (within 1 week)**
   - Fast-track Phase 2 development
   - Prioritize bilingual support reintroduction

3. **Long-term (within 1 month)**
   - Revert to bilingual system if absolutely necessary
   - Document lessons learned

---

**Last Updated:** 2025-10-09
**Version:** 1.0
**Owner:** Product Team
