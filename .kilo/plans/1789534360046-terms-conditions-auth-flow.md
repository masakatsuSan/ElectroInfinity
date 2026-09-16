# Terms & Conditions in Auth Flow — Implementation Plan

## Context

Users currently can activate/login accounts without acknowledging any terms, conditions, or legal disclaimers. The user requires a mandatory Terms & Conditions (T&C) checkbox that must be ticked before account activation and login. The T&C should cover account access responsibility, Electro Infinity platform terms, and legal disclaimers.

## Scope

Add T&C checkbox to 5 auth pages:
1. **`frontend/src/pages/Activate.jsx`** — Step 3 (Set Password) — student account activation
2. **`frontend/src/pages/faculty/FacultyActivate.jsx`** — Step 3 (Set Password) — faculty account activation
3. **`frontend/src/pages/Login.jsx`** — student login
4. **`frontend/src/pages/faculty/FacultyLogin.jsx`** — faculty login
5. **`frontend/src/pages/Register.jsx`** — student registration

## Files to Create

### 1. `frontend/src/components/TermsCheckbox.jsx`
Reusable checkbox component with:
- A styled checkbox input
- Label text: "I agree to the Terms & Conditions and Privacy Policy"
- A "View Terms" link that opens a modal/expanded view
- Accepts `checked`, `onChange`, and `error` props
- Uses existing Tailwind CSS classes and color conventions from the project

### 2. `frontend/src/components/TermsModal.jsx`
Modal dialog displaying full T&C text with:
- Scrollable content area
- Close button
- Sections: Account Access & Security, Platform Terms, Legal Disclaimer, Data & Privacy, Consent
- Uses existing color palette (COLORS object pattern from Activate.jsx)

## Files to Modify

### 3. `frontend/src/pages/Activate.jsx`
- Add `termsAccepted` state (useState false)
- Add `TermsCheckbox` component below password fields in Step 3
- Add `termsError` state for validation message
- In `handleActivate`: if `!termsAccepted`, set error "You must accept the Terms & Conditions to activate your account" and return
- Disable the activate button when terms not accepted (or show error on submit)
- Add `TermsModal` trigger link near the checkbox

### 4. `frontend/src/pages/faculty/FacultyActivate.jsx`
- Same pattern as Activate.jsx
- Add `termsAccepted` state
- Add `TermsCheckbox` in Step 3 form
- Validate in `handleActivate`
- Add `TermsModal` trigger

### 5. `frontend/src/pages/Login.jsx`
- Add `termsAccepted` state
- Add `TermsCheckbox` below password field in both mobile and desktop form layouts
- Add `termsError` state
- In `handleSubmit`: if `!termsAccepted`, set error "You must accept the Terms & Conditions to sign in" and return
- Add `TermsModal` trigger

### 6. `frontend/src/pages/faculty/FacultyLogin.jsx`
- Same pattern as Login.jsx
- Add `termsAccepted` state
- Add `TermsCheckbox` below password field
- Validate in `handleSubmit`
- Add `TermsModal` trigger

### 7. `frontend/src/pages/Register.jsx`
- Add `termsAccepted` state
- Add `TermsCheckbox` above submit button
- Validate in `handleSubmit`: if `!termsAccepted`, set error "You must accept the Terms & Conditions to register"
- Add `TermsModal` trigger

## T&C Content (to display in modal)

```
TERMS & CONDITIONS OF USE

1. Account Access & Security
- You are solely responsible for maintaining the confidentiality of your account credentials.
- You agree not to share your login credentials with any third party.
- You are responsible for all activities that occur under your account.
- Electro Infinity is not liable for unauthorized use of your account.

2. Platform Terms
- Electro Infinity is an educational platform providing department resources, lecture materials, and community features.
- You agree to use the platform only for legitimate educational purposes.
- You agree not to misuse the platform or engage in any harmful/unauthorized activities.

3. Legal Disclaimer
- Electro Infinity provides its services "as is" without warranties of any kind.
- The platform is not responsible for any loss of data or communication failures.
- All content is provided for informational purposes only.

4. Data & Privacy
- By using this platform, you consent to the collection and processing of your personal data as described in the Privacy Policy.
- Your institutional email and roll number are used for verification purposes only.
- We do not sell your personal information to third parties.

5. Consent
- By checking the agreement box, you acknowledge that you have read, understood, and agree to all terms outlined above.
- You may deactivate your account at any time by contacting the administration.
- These terms are subject to revision at any time. Continued use constitutes acceptance of revised terms.
```

## Design Conventions to Follow

- Use existing `COLORS` object pattern (from Activate.jsx) for inline styles, OR use Tailwind classes (from FacultyActivate.jsx pattern)
- Match the existing form styling (input styles, button styles, error message styles)
- Use the same font families (`DISPLAY_FONT`, `TEXT_FONT`)
- Use existing color variables: `coral` for errors, `link` for links, `muted` for secondary text
- Error messages use the `errorStatusStyle` pattern (coral text on errorSurface background)

## Validation Steps

1. Start dev server: `cd frontend && npm run dev`
2. Navigate to `/activate` — complete Step 1 (roll number), Step 2 (OTP), Step 3 (password)
3. Verify: Activate button is blocked/error shown when T&C checkbox is unchecked
4. Verify: Account activates successfully after checking T&C and submitting
5. Navigate to `/login` — verify T&C checkbox appears and blocks login when unchecked
6. Navigate to `/faculty/activate` — verify same T&C flow for faculty
7. Navigate to `/faculty/login` — verify T&C checkbox appears and blocks login when unchecked
8. Navigate to `/register` — verify T&C checkbox appears and blocks registration when unchecked
9. Verify "View Terms" link opens modal with full T&C content
10. Verify all existing functionality remains intact (OTP flow, password reset, navigation)
