document.querySelector("#registration-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.querySelector("#username").value;
    const password = document.querySelector("#password").value;
    const confirmPassword = document.querySelector("#confirmPassword").value;
    try {
        const response = await fetch("/user/registration", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password, confirmPassword }),
        });
        if (response.ok) {
            const result = await response.json();
            console.log(result.message); // Лог для перевірки
            window.location.href = "/login";
        } else {
            console.error("Failed to register:", response.statusText);
        }
    } catch (error) {
        console.error("Error registering:", error);
    }
}