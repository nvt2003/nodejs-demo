async function sendEmail(to, subject, content) {
    const response = await fetch(
        "https://api.resend.com/emails",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: "onboarding@resend.dev",
                to: [to],
                subject: subject,
                text: content
            })
        }
    );

    const data = await response.json();
    //kiểm tra xem đã gửi email được chưa
    if (!response.ok) {
        console.error("Resend error:", data);
        throw new Error(
            data.message || "Gửi email thất bại"
        );
    }

    return data;
}

export default sendEmail;