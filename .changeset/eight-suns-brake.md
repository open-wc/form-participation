---
'@open-wc/form-control': patch
---

- Inline TS sourcemaps so developers can debug successfully in form control code
- Fix an issue present when all validators are sync validators where the validity doesnt update (and validationMessages aren't updated) if the validity state hasn't changed from its initial state.
