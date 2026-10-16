# Cafe Payroll (React Native + Expo)

A beginner-friendly mobile prototype with a cafe-inspired brown and beige theme.

## Features included
- Admin and Staff demo login
- Separate role-specific tabs
- Admin dashboard, employee list, attendance, payroll, payslips, and reports
- Staff dashboard, time-in/time-out, salary history, payslips, and profile
- Add/deactivate employee actions
- Generate sample payroll records and mark them paid
- AsyncStorage persistence for local demo data

## Run the app
1. Install Node.js LTS.
2. Extract this folder and open a terminal inside `CafePayroll`.
3. Run `npm install`.
4. Run `npx expo start`.
5. Open Expo Go on your phone and scan the QR code, or run it in an emulator.

## Demo login
Admin:
- Email: `admin@cafepayroll.com`
- Password: `admin123`

Staff:
- Email: `staff@cafepayroll.com`
- Password: `staff123`

## Important prototype notes
- Data is stored locally on one device. This is not multi-user cloud synchronization.
- Demo login checks credentials in the app and is not secure for production.
- Payroll uses a sample 5% deduction and simplified demo calculations. Do not use these values for actual payroll without checking current Philippine requirements and the cafe's actual policies.
- PDF/CSV export, full account management, statutory deductions, and server-side security are not implemented in this starter.
- Admin and staff screens are separated in the UI, but a production system must enforce permissions on a backend too.
