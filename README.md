# Smart Hiring Frontend

This folder contains the React frontend for the Smart Hiring project.

## Main Pages

- landing page
- login / register
- worker dashboard
- manager dashboard
- admin dashboard

## Frontend Stack

- React
- React Router
- Axios
- Tailwind CSS

## Running The Frontend

From this folder, run:

```bash
npm install
npm start
```

Then open [http://localhost:3000](http://localhost:3000).

## Notes

- The frontend expects the backend API to be running on `http://localhost:8080`.
- We kept most state management local to each page because that was the simplest setup for our team.
- Some dashboard pages got expanded over time as backend features were added.

## Things We Would Improve Later

- break larger page components into smaller reusable pieces
- add stronger route protection
- improve automated tests
- move some repeated logic into shared helpers
