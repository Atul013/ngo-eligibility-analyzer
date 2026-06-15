# Sample Data

This folder contains a small sample CSV you can use to test the **Upload CSV** feature in the app.

## How to use it

1. Open the app and go to the **Beneficiaries** page
2. Click **Upload CSV** and select `sample_beneficiaries.csv`
3. The records will be imported alongside the existing dataset

## Important

The 10 rows here are intentionally minimal — just enough to verify that the upload flow works end-to-end and that the dashboard charts update after import.

---

**Real beneficiary data should never be committed to version control.**
The main `backend/data/beneficiaries.csv` (250 synthetic records used to seed the database) is included only because it is fully synthetic and contains no personal information. If you replace it with real data, add it to `.gitignore` immediately.
