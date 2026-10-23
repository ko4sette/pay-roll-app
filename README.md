# Cafe Payroll (React Native + Expo)

A beginner-friendly mobile prototype with a cafe-inspired brown and beige theme.

## Features included
- Admin demo login and staff accounts created by the admin
- Separate role-specific tabs
- Admin dashboard, employee list, attendance, and payroll
- Staff dashboard, time-in/time-out, salary history, and profile
- Add/deactivate employee actions
- Position selection with configured hourly rates when adding an employee
- One time-in and one time-out per employee per local calendar day
- Generate sample payroll records and mark them paid
- AsyncStorage persistence for local demo data
- Browse employee, attendance, and payroll records from either role dashboard
- Open record details through Expo Router dynamic routes

## Run the app
1. Install Node.js LTS.
2. Extract this folder and open a terminal inside `CafePayroll`.
3. Run `npm install`.
4. Run `npx expo start`.
5. Open Expo Go on your phone and scan the QR code, or run it in an emulator.

## Sign in
- Choose the Admin or Employee option on the login screen.
- Admin demo account: email `admin@cafepay.com`, password `admin123`.

There are no preloaded staff accounts. The admin must add an employee from the Employees screen; the app assigns the next available `CAF` plus three-digit Employee ID and uses that same ID as the temporary password. IDs are allocated from a persistent local sequence and are not reused after allocation. Employees sign in with those credentials and must enter the current temporary password and choose a new password of at least 8 characters before continuing. Admins can reset an employee's password to their Employee ID from the Employees screen, requiring another password change at the next login.

## Browse record details
Use **Browse Records** from the Admin or Employee dashboard to open the Home list. Select an employee, attendance, or payroll record to open its dynamic Details route; use **Back** to return. Employees only see their own records in this list. The starter has no preloaded employee, attendance, or payroll records, so add records through the existing app before expecting the list to contain five or more items.

## Position hourly rates
New employees receive the configured hourly rate for their selected position:
- Manager: ₱150/hour
- Barista: ₱120/hour
- Cashier: ₱100/hour
- Kitchen staff: ₱120/hour
- Service crew: ₱100/hour

These are demo configuration values. Update `constants/positions.ts` if the cafe's approved rates change.

## Important prototype notes
- Data is stored locally on one device. This is not multi-user cloud synchronization.
- This project has no backend or server-side account store. Employee credentials, including passwords and password-change status, and payroll data are stored in AsyncStorage; the demo admin credential is included in the client app. Employee ID generation is persistent only on this device and cannot guarantee uniqueness across devices or concurrent installations. The role selector, password-change requirement, and role-specific screens are only client-side prototype behavior; they are not secure authentication or access control. Do not use it for real accounts or sensitive payroll data.
- The Expo Router record routes use the local session and locally stored data for UI-level access checks only; they do not provide server-enforced authorization.
- A production system should authenticate through a trusted backend, store salted password hashes rather than plaintext passwords, require secure transport, and enforce role permissions on the server. Employee ID is an account identifier, not a secret; always pair it with a password or a stronger authentication factor.
- Payroll uses a sample 5% deduction and simplified demo calculations. Do not use these values for actual payroll without checking current Philippine requirements and the cafe's actual policies.
- PDF/CSV export, full account management, statutory deductions, and server-side security are not implemented in this starter.
- Admin and staff screens are separated in the UI, but a production system must enforce permissions on a backend too.
