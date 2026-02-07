import "./globals.css";

export const metadata = {
  title: "AI Resume Reviewer",
  description: "Hackathon-ready AI resume review app"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
