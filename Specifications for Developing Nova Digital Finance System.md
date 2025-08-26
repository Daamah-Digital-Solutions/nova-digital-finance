# Specifications for Developing Nova Digital Finance System

## Introduction
This document contains complete and detailed specifications for developing the "Nova Digital Finance System" based on the provided brief. The purpose is to deliver it to a full-stack developer for full implementation without deleting or abbreviating any feature or detail. Every feature mentioned here is as it appeared in the brief, organized to facilitate implementation. The system is based on digital financing with the "Pronova" currency (PRN) without interest, with fees of 3-5%, linked to the investment platform "Capimax".

The system must be:
- A web application with compatibility for phones and tablets, appearing as an application (PWA - Progressive Web App) with the ability to add an icon on the home screen.
- Multi-language (4-6 languages, such as Arabic and English as a minimum).
- Multi-modes (Light mode and Dark mode).
- Cyber-secure, with partnerships like MHCC for protection and verification.
- Supports other digital currencies in the future, not just "Pronova".
- Company details: Nova Financial Digital is a licensed company that finances digital currencies under certain financing terms and conditions, helps in financing and assistance, as described in the "About Us" section below.

**Note to the Developer:** Do not miss any feature or detail. Every element mentioned must be fully implemented. If there is any ambiguity, consult the owner before implementation.

## General Requirements
- **Technical Environment:** 
  - Front-end: React.js or Vue.js for the interactive interface, with PWA support.
  - Back-end: Python with Django for the backend logic, SQL database (PostgreSQL) or NoSQL (MongoDB) for data storage.
  - API: RESTful APIs for integration with "Capimax", and payments (Visa, MasterCard, etc.).
  - Security: HTTPS, JWT for authentication, KYC validation, data encryption.
  - Fees: 3-5%, calculated automatically.
- **Currencies:** Starts with "Pronova", but the platform is open to other currencies (not limited to one).
- **Integrations:** 
  - With "Capimax" for investment.
  - Payments: Visa, MasterCard, etc.
  - Email: For sending notifications, documents (PDF).
- **Design:** 
  - Charts for installments.
  - Large and clear buttons (like "Pay Installment", "Invest by Pronova").
  - Texts concise and organized on mobile (capital or small only, no mixing).
  - PWA: Can be added as an icon on the phone.
  - Modes: Light mode (white) and Dark mode (dark), with user selection.

## Main Features (Complete List Without Deletion)

### 1. Core Idea and Financing
- The company provides financing with the "Pronova" currency without interest, with fees ranging from 3-5%.
- Example: Client requests 10,000 coins, their value today is 10,000 dollars, the debt in dollars is repaid over a year.
- Issues an electronic certificate (PDF) proving ownership of the currency at dollar value, mortgaged to "Nova" until repayment.
- Uses the certificate for investment in "Capimax" as if it were real money.
- "Capimax" treats him as a regular client: profile, profits, etc.
- Monthly repayment calculated automatically.
- If not invested: Repays in dollars, then receives the "Pronova" currency at its current value.
- If invested: Releases the mortgage in "Capimax" after repayment, no interest deduction, free to deal with income and investment.
- Investments are mortgaged, no withdrawal until repayment or clearance and settlement.
- Company details in this context: Nova Financial Digital acts as a financing company or financing bank, providing this service.

### 2. Application Submission Process and KYC
- The user enters the site and submits a financing request.
- Large KYC: Name, phone number, address, job, income source, copy of bank statement, country, job, investment summary, passport details, bank statement, ID, other documents (place for electronic attachment).
- During submission: Conditions that must be agreed upon (checkboxes):
  - The loan at dollar value, debt in dollars, mortgaged by "Nova".
  - After repayment: Transfer the amount to your wallet at currency value or release the investment value in "Capimax".
  - Investments are mortgaged.
  - Agreement is considered a debt instrument.
  - Ownership certificate = debt instrument.
  - Financing contract between the client and the platform.
- Specifies: Financing amount, duration, interest field (field, but we determine it, usually without).
- After submission: Automatic email confirming the request.
- Approval: Email or notification in the account, then pay fees.
- Automatic processing: The system approves or rejects immediately (like credit card), or manual review (decide later).
- If approved: Proceed to payment, specify how many "Pronova", today's value in dollars, 3-5% fees, pay via Visa etc.

### 3. Signing Process, Certificate, and Contract
- After payment: Place for electronic signature.
- The system issues an electronic certificate (PDF): Summary of all details, mortgaged to "Nova Financial Digital".
- Financing contract (PDF): Conditions, client name, data, value.
- The contract is tripartite (but mentioned as a financing contract between Nova and the client).
- Certificate in letter form, in English (or Arabic+English based on language).
- Sent via email and saved in the account.

### 4. Account Content and Documents
- Account for each client: Data, documents, statement.
- Documents as PDF: KYC, loan details, fee receipt.
- Sent via email.
- Account content:
  - Financing amount, number of coins, dollar value, paid fees, interest.
  - Loan value, duration, monthly installment.
  - Chart: Monthly installments, paid (green for paid), bank-like statement (payment of first month on date, etc.).
- Requests: Additional loan, deferral, loan settlement, transfer to another person, waiver, loan increase, installment deferral (4-6 named requests, in a dropdown list or buttons).
- Payment method: Large button "Pay" or "Pay Installment", pays the installment, updates the chart immediately (green).
- The button is clear from the second day.

### 5. Investment Option Inside the Account
- Large part: "Invest by Pronova", large button in several places inside the account (no need to exit).
- Transfers to "Capimax": Directly to investments page, or registration if needed, or the site (choose the easiest for the user).
- Explanation: You can invest from "Capimax" app or platform, manage the investment there.

### 6. Main Platform Content and Basic Information
- Main sections: About Us, Financing Process, Investment Process, Terms and Conditions.
- Easy explanation: Who we are (what you do), procedures (step by step: buy, invest, negotiate, settle/exit).
- Side bar:
  - About Us: Licensed company, finances digital currencies in some financings according to terms and conditions, finances and helps, all that.
  - Features: Enables investors to invest by helping them first to buy digital currencies with future, vision, goals, uses, without large capital, helps use these currencies in investment and profit with linking to foreign currency, you borrow in foreign currency and invest in foreign currency, thus removes fears of currency decline, as if you take a loan, the loan brings you profit and you repay installments from it.
  - Steps: Explain how, enter to register in a certain way, with Gmail, registration in different and nice ways, by email, Gmail, or via email or Facebook or all that, modern things.
  - Partnership with "Capimax": Global company working in investments always in such fields and works in tokenization and real estate and so on, and among our partnerships with it that we give you a certificate you use it such and such and own with it there and your investments grow with them and so on.
  - Document Center: Inquiry about any issued certificate or contract and download from us, may want to ask about his permissions, so there is a documents center.
  - Terms and Conditions: Standalone icon, with all terms we talked about, we say them all, and in it terms and conditions as PDF for download.
  - Risks: Talk about risks, that risks that the currency declines and that something happens to the currency and so on, but you take the currency against it in dollars and invest it and thus no risks because you don't take the currency and so.
  - Communication: Social media pages and when he enters them he enters and so.
  - Partnerships: Important, with details like we have "MHCC" preserving the investment, insures or not, insures sites with safety and cyber security, CIM verification and all documents authenticated and preserved.

### 7. Available Currencies and FAQ Section
- Starts with "Pronova", but offers all available currencies through the platform (to open the door for any company or currency wanting the same idea).
- FAQ section: Frequent questions, clarifications from all the above, what we do what, why chose "Capimax", why not know what, from where not know what, is it "Capimax" only? No we are open to all companies, is this currency only? No open to all currencies that not know what, all that. If such happens it solves, solves how, and if such happens what to do, and if such.

### 8. User Process Summary and Additional Requests
- Registration: Complete data in a large professional way.
- Financing request: Turns to PDF automatically, sent to email and comes to us. Exists with all his data registered with us on back-end PDF, exists with him.
- Processing: As if the system sees if it approves or not. The remaining part I'll tell you about, will it approve at the time or review? Tell you later. Prefers to be at the time like the system here, like who applies for loan or credit card, the system searches and at the end tells him approved or approved.
- After approval: Pay fees, sign document, then the system, you made a system that issues two papers: The contract, and the certificate, the certificate made for him a paper like that on letter form with details, it is a certificate made in English, and so, and if he chose Arabic it goes to him Arabic and English.
- Sent to email and to his file.
- Enters finds his file ready with all details, loan value, financing value, what all we said.
- From inside his file or account finds page "Invest by such", meaning if he wants to click it takes him to "Capimax". In "Capimax" invests at ease. What does he take in his hand? And he going "Capimax" takes the certificate.
- Client number: Like that like bank like financing the client has identification number or client-specific number and account number, "account number" and client number, the identification number. You made it the system issues it and the paper issues it and exists for him in the account from inside.
- This is the idea of the whole topic.
- Requests it allows from inside, requests name them, don't write requests and done, no. From inside there will be two large lit lamps like that, which is "Invest by" this currency, and "Pay Installment", "Pay" pay your installments. In chart we said we clarify everything, there is something called requests, which is? Request to raise the loan, request to settle the loan, request waiver, five six names meaning. Meaning from he if took loan with 10,000 wants to increase it so request to raise the loan, if wants to settle such such, request deferral installment, request not know what, four five requests from them names, must we write them so he knows the name.
- Or it is one field written in it, meaning he clicks on it like that it drops for him that names of requests, understood me like that? Tells him request such and request such and request such and such and such. He clicks on the request he wants. Understood me like that? So this is the chic, the professionalism that you name the requests. Or want to abbreviate so that.

### 9. Design and Compatibility
- Design to be used on phone and tablet and everything, but we want to make it in a way that it has an icon on the phone, not website no turn icon, and in all sites you make make it like that that he turns that he gives him icon on the phone as if this application.
- Up to tokenization even the digital currency all, that it appears as if application, the icon because engineer Muhammad told me that this is required at first, so we tell him click on such turns the page for him like that, ok? So we want it as if application, and of course we said the mode and shape and so, and of course review that it be on the phone, so the talk concise, the talk organized, no capital and small inside each other, either small or capital, like that meaning.

## Implementation Plan
- **Phase 1:** Build the back-end (API, database, KYC validation) using Python and Django.
- **Phase 2:** Front-end (pages, buttons, charts).
- **Phase 3:** Integrations (payments, "Capimax", email).
- **Phase 4:** Test every feature (do not miss anything).
- **Phase 5:** Deploy as multi-language PWA with Light and Dark modes.

This document is complete, covering every letter from the brief. If implemented, confirm every point.