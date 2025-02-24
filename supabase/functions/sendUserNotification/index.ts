import { createServer } from "http";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  try {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString(); // Convert Buffer to string
    });

    req.on("end", async () => {
      const { userEmail, answer } = JSON.parse(body); // Parse the JSON

      const response = await fetch("https://api.supabase.com/v1/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          to: userEmail,
          subject: "Risposta alla tua richiesta",
          content: `
            Ho risposto alla tua richiesta:
            ${answer}
            
            Grazie per avermi contattato!
            Federico
          `,
        }),
      });

      if (!response.ok) throw new Error("Failed to send email");

      res.writeHead(200, {
        ...corsHeaders,
        "Content-Type": "application/json",
      });
      res.end(JSON.stringify({ success: true }));
    });
  } catch (error) {
    res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      })
    );
  }
});

server.listen(8000, () => {
  console.log("Server is running on http://localhost:8000");
});
