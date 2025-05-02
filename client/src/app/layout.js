import "./globals.css"; // Import the global CSS file

export const metadata = {
  title: "เกมส์คำต้องห้าม", // Specify the title for the web page
  description:
    "เกมส์คำต้องห้าม online",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/milligram/1.4.1/milligram.css" // Link to the Milligram CSS stylesheet
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
