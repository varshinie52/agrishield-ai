 function authCheckBeforeScan() {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (!token || !user) {
        console.error("[Security Layer 2] Authentication check failed. Directing to login.");
        localStorage.clear();
        window.location.replace("login.html");
        return false;
    }
    return true;
}

const URL = "/model/";

let model;
let maxPredictions;

// LOAD AI MODEL
async function loadModel() {

    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    try {

        model = await tmImage.load(
            modelURL,
            metadataURL
        );

        maxPredictions =
            model.getTotalClasses();

        console.log(
            "✅ AI Model Loaded Successfully"
        );

        const btn =
            document.getElementById(
                "executionScanTriggerBtn"
            );

        if (btn) {

            btn.innerText =
                "Initialize AI Diagnosis Grid";

            btn.disabled = false;
        }

    } catch (error) {

        console.error(
            "❌ AI Loading Error:",
            error
        );

        const btn =
            document.getElementById(
                "executionScanTriggerBtn"
            );

        if (btn) {

            btn.innerText =
                "❌ AI Loading Error. Verify model folder structure.";

            btn.disabled = true;
        }
    }
}

// MAIN SYSTEM
document.addEventListener(
    "DOMContentLoaded",
    () => {
        if (!authCheckBeforeScan()) {
            return;
        }

        loadModel();

        const picker =
            document.getElementById(
                "fileInput"
            );

        const zone =
            document.getElementById(
                "interactiveDropZone"
            );

        const preview =
            document.getElementById(
                "imageFilePreview"
            );

        const prompt =
            document.getElementById(
                "uploadPromptInfoText"
            );

        const btn =
            document.getElementById(
                "executionScanTriggerBtn"
            );

        if (!picker || !zone || !preview || !btn) {

            console.error(
                "❌ DOM Elements Missing"
            );

            return;
        }

        // CLICK TO OPEN FILE
        zone.addEventListener(
            "click",
            () => {
                if (!authCheckBeforeScan()) {
                    return;
                }
                picker.click();
            }
        );

        // DRAG OVER
        zone.addEventListener(
            "dragover",
            (e) => {

                e.preventDefault();

                zone.classList.add(
                    "drag-over"
                );
            }
        );

        // DRAG LEAVE
        zone.addEventListener(
            "dragleave",
            () => {

                zone.classList.remove(
                    "drag-over"
                );
            }
        );

        // DROP FILE
        zone.addEventListener(
            "drop",
            (e) => {

                e.preventDefault();

                zone.classList.remove(
                    "drag-over"
                );

                if (!authCheckBeforeScan()) {
                    return;
                }

                const file =
                    e.dataTransfer.files[0];

                if (file) {

                    processImage(file);
                }
            }
        );

        // FILE PICK
        picker.addEventListener(
            "change",
            () => {

                if (!authCheckBeforeScan()) {
                    return;
                }

                const file =
                    picker.files[0];

                if (file) {

                    processImage(file);
                }
            }
        );

        // IMAGE PROCESS
        function processImage(file) {

            if (!authCheckBeforeScan()) {
                return;
            }

            const reader =
                new FileReader();

            reader.onload = () => {

                preview.src =
                    reader.result;

                preview.style.display =
                    "block";

                if (prompt) {

                    prompt.style.display =
                        "none";
                }

                btn.style.display =
                    "block";

                // SAVE IMAGE
                localStorage.setItem(
                    "agri_temp_scan_binary",
                    reader.result
                );

                console.log(
                    "✅ Image Cached"
                );
            };

            reader.readAsDataURL(file);
        }

        // RUN AI
        btn.addEventListener(
            "click",
            async () => {

                if (!authCheckBeforeScan()) {
                    return;
                }

                if (!model) {

                    alert(
                        "AI model not loaded."
                    );

                    return;
                }

                btn.innerText =
                    "🔄 Scanning...";

                btn.disabled = true;

                try {

                    const prediction =
                        await model.predict(
                            preview
                        );

                    prediction.sort(
                        (a, b) =>
                            b.probability -
                            a.probability
                    );

                    const top =
                        prediction[0];

                    console.log(
                        "✅ Prediction:",
                        top
                    );

                    const result = {

                        name:
                            top.className,

                        confidence:
                            (
                                top.probability *
                                100
                            ).toFixed(1) + "%",

                        severity:
                            top.className
                                .toLowerCase()
                                .includes(
                                    "healthy"
                                )
                                ? "Optimal"
                                : "Moderate Risk",

                        area:
                            top.className
                                .toLowerCase()
                                .includes(
                                    "healthy"
                                )
                                ? "0%"
                                : "34%",

                        date:
                            new Date().toLocaleDateString()
                    };

                    // SAVE RESULT
                    localStorage.setItem(
                        "agri_last_diagnostic_output",
                        JSON.stringify(result)
                    );

                    console.log(
                        "✅ Result Saved Locally"
                    );

                    // SAVE TO BACKEND API
                    try {
                        if (authCheckBeforeScan() && typeof apiSaveHistory === 'function') {
                            const imageData = localStorage.getItem("agri_temp_scan_binary") || '';
                            await apiSaveHistory(
                                result.name,
                                parseFloat(result.confidence),
                                imageData.substring(0, 500000) // Limit base64 size
                            );
                            console.log("✅ Scan saved to backend");
                        }
                    } catch (saveErr) {
                        console.warn("⚠ Backend save skipped:", saveErr.message);
                    }

                    // REDIRECT
                    window.location.href =
                        "result.html";

                } catch (error) {

                    console.error(
                        "❌ Prediction Failed:",
                        error
                    );

                    alert(
                        "Prediction failed."
                    );

                    btn.disabled = false;

                    btn.innerText =
                        "Initialize AI Diagnosis Grid";
                }
            }
        );
    }
);