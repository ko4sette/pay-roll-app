# Cafe Payroll (React Native + Expo)

A beginner-friendly mobile prototype with a cafe-inspired brown and beige theme.

## Features included
- Admin demo login and staff accounts created by the admin
- Finance demo login with a payment-focused workspace
- Separate role-specific tabs
- Admin dashboard, employee list, attendance, and payroll
- Staff dashboard, time-in/time-out, salary history, and profile
- Add/deactivate employee actions
- Position selection with configured hourly rates when adding an employee
- One time-in and one time-out per employee per local calendar day
- Generate daily payroll records from attendance for Finance to pay
- Finance records pending employee payments, including method and optional reference
- Admin can set the next payday; employees see the saved date on their dashboard
- Attendance and payroll records show their latest update time
- Submit and review staff cashout requests
- AsyncStorage persistence for local demo data
- Browse employee, attendance, and payroll records from either role dashboard
- Open record details through Expo Router dynamic routes
- Shared month-view payday calendar with recurring Sunday paydays and a live countdown on all role dashboards
- Admin store-open control; employee clock-in and clock-out are available only while the café is open
- Required, validated phone numbers when adding employees; Admin can update them and staff can view them in Profile
- Finance records wage payments directly with a payment method and optional receipt or transfer code
- Role-specific, data-derived in-app updates with unread counts, mark-as-read actions, and direct navigation
- Optional role onboarding on first sign-in, with a Help button to replay it
- Simple payslips showing pay period, hours, earnings, applicable deductions, take-home pay, and payment status/date

## Run the app
1. Install Node.js LTS.
2. Extract this folder and open a terminal inside `CafePayroll`.
3. Run `npm install`.
4. Run `npx expo start`.
5. Open Expo Go on your phone and scan the QR code, or run it in an emulator.

## Sign in
- Choose Admin, Finance, or Employee on the login screen.
- Admin demo account: email `admin@cafepay.com`, password `admin123`.
- Finance demo account: email `finance@cafepay.com`, password `finance123`.
- Admin sets the next payday from **Prepare payroll**; the reminder appears on employee dashboards.

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
- Data, including payroll and cashout requests, is stored locally on one device. This is not multi-user cloud synchronization.
- The payday calendar, store status, phone records, notifications, and tutorial completion are also local to this installation. A different laptop/browser will not see employee accounts or changes made on another device.
- Store-status restrictions and role rules are client-side checks only. They are not backend-enforced, and this app has no database server. Do not rely on the clock restriction for real payroll control.
- This project has no backend or server-side account store. Employee credentials, including passwords and password-change status, and payroll data are stored in AsyncStorage; the demo admin credential is included in the client app. Employee ID generation is persistent only on this device and cannot guarantee uniqueness across devices or concurrent installations. The role selector, password-change requirement, and role-specific screens are only client-side prototype behavior; they are not secure authentication or access control. Do not use it for real accounts or sensitive payroll data.
- The Expo Router record routes use the local session and locally stored data for UI-level access checks only; they do not provide server-enforced authorization.
- A production system should authenticate through a trusted backend, store salted password hashes rather than plaintext passwords, require secure transport, and enforce role permissions on the server. Employee ID is an account identifier, not a secret; always pair it with a password or a stronger authentication factor.
- Payroll uses simplified demo calculations with no automatic deductions. Record deductions only when a real, documented deduction applies; verify payroll rules and the cafe's policies before using real payroll amounts.
- PDF/CSV export, full account management, statutory deductions, and server-side security are not implemented in this starter.
- Admin and staff screens are separated in the UI, but a production system must enforce permissions on a backend too.
- The Finance account is a demo client-side account. Payment records are stored locally on the device, so this prototype does not synchronize Admin and Finance across devices. Do not use the demo credentials or local payment workflow for real payroll.
