# Lighthouse Accessibility Audit Reports

This directory contains Lighthouse accessibility audit reports for the Gentil Feedback application.

## Quick Reference

- **Last Audit:** 2025-10-06
- **Average Score:** 100%
- **Pages Audited:** 5
- **Issues Found:** 0

## Files

- `ACCESSIBILITY_AUDIT_REPORT.md` - Comprehensive audit report with findings and recommendations
- `summary.json` - JSON summary for programmatic access
- `homepage.json` - Detailed Lighthouse report for homepage
- `signin.json` - Detailed Lighthouse report for sign-in page
- `dashboard.json` - Detailed Lighthouse report for dashboard
- `feedback.json` - Detailed Lighthouse report for feedback page
- `settings.json` - Detailed Lighthouse report for settings page

## Running Future Audits

### Prerequisites
1. Ensure dev server is running: `npm run dev`
2. Verify server is accessible at http://localhost:3000

### Run Audits

```bash
# Single page audit
npx lighthouse http://localhost:3000 \
  --only-categories=accessibility \
  --output=json \
  --output-path=./lighthouse-reports/page-name.json \
  --chrome-flags="--headless --no-sandbox"

# All pages (automated script)
./run-accessibility-audit.sh
```

### Analyze Results

```bash
# View summary
cat lighthouse-reports/summary.json

# Extract score from individual report
cat lighthouse-reports/homepage.json | grep -A 2 '"accessibility"' | grep '"score"'
```

## Integration with CI/CD

Add to your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run Accessibility Audits
  run: |
    npm run dev &
    sleep 10
    npx lighthouse http://localhost:3000 --only-categories=accessibility
    # Fail if score below threshold
```

## Baseline Scores

These scores serve as regression benchmarks:

| Page | Score | Date |
|------|-------|------|
| Homepage | 100% | 2025-10-06 |
| Sign In | 100% | 2025-10-06 |
| Dashboard | 100% | 2025-10-06 |
| Feedback | 100% | 2025-10-06 |
| Settings | 100% | 2025-10-06 |

## Accessibility Checklist

When adding new pages or features:

- [ ] Run Lighthouse accessibility audit
- [ ] Achieve minimum 90% score
- [ ] Test with keyboard navigation
- [ ] Test with screen reader (NVDA/JAWS/VoiceOver)
- [ ] Verify color contrast meets WCAG AA (4.5:1)
- [ ] Ensure all interactive elements have labels
- [ ] Check heading hierarchy (no skipped levels)
- [ ] Verify ARIA attributes are correct
- [ ] Test form validation accessibility
- [ ] Verify focus management

## Resources

- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Axe DevTools](https://www.deque.com/axe/devtools/)
- [WebAIM Resources](https://webaim.org/)

## Contact

For accessibility questions or to report issues, contact the development team.
