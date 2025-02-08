import { chatAPI, imageAPI, segmentAPI, audioAPI } from "../utils/apiConfig";
import { getChapterPrompt } from "./bookLogic";

export const findChapterPrompt = async (prompt, bookName) => {
  try {
    const response = await fetch(segmentAPI, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: prompt,
        bookName: bookName,
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // const data = await response.text();
    const data = await response.json();
    console.log("Segment of text: " + data.response);
    return data.response;
  } catch (error) {
    console.error("Error with Segment API:", error);
    throw new Error("Failed to process chapter text. Please try again.");
  }
};

export const generatePromptFromText = async (prompt, bookTitle) => {
  try {
    const response = await fetch(chatAPI, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        bookTitle,
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("DALL-E Prompt: " + data.response);
    return data.response;
  } catch (error) {
    console.error("Error with ChatGPT API:", error);
    throw new Error("Failed to generate image prompt. Please try again.");
  }
};

export const generateImageFromPrompt = async (prompt, bookTitle) => {
  try {
    console.log("generating image.. this can take up to 15s");
    const response = await fetch(imageAPI, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: prompt,
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (!data.result) {
      throw new Error("Image URL not received from API");
    }
    // console.log(data)
    console.log(data.result);
    return data.result;
  } catch (error) {
    console.error("Error calling the Image API:", error);
    throw new Error("Failed to generate image. Please try again.");
  }
};

export const processChapter = async (chapter, epubReader, bookName) => {
  try {
    if (!chapter || !epubReader || !bookName) {
      throw new Error("Invalid input parameters for chapter processing");
    }

    // Get the chapter prompt
    const chapterPrompt = await getChapterPrompt(chapter, epubReader);
    if (!chapterPrompt) throw new Error("Failed to get chapter prompt");

    // Start generating audio concurrently.
    console.log("generating audio.. this can take up to 15s");
    const audioPromise = generateAudioFromText(chapterPrompt);

    // Process the image generation chain.
    const chapterSegment = await findChapterPrompt(chapterPrompt, bookName);
    if (!chapterSegment) throw new Error("Failed to find chapter segment");

    if (chapterSegment !== "False") {
      const processedPrompt = await generatePromptFromText(chapterSegment, bookName);
      const generatedImageUrl = await generateImageFromPrompt(processedPrompt, bookName);

      // Await the audio promise now.
      if (generatedImageUrl) {
        alert("This is taking longer than expected, please wait 15s (server in cold state)")
      }
      const audioResponse = await audioPromise;
      console.log("audio generated");
      return {
        displayPrompt: chapterSegment,
        imageUrl: generatedImageUrl,
        audioStream: audioResponse,
      };
    }

    // If chapterSegment indicates we shouldn't process this chapter,
    // you might still want to await the audio if needed (or ignore it).
    await audioPromise; // Optional depending on your needs.
    return {
      displayPrompt:
        "This chapter is not part of the plot, please click next chapter.",
      imageUrl:
        "https://cdn2.iconfinder.com/data/icons/picons-basic-2/57/basic2-085_warning_attention-512.png",
      audioStream: null,
    };
  } catch (error) {
    throw new Error(`Error processing chapter: ${error.message}`);
  }
};


// In generation.js
export const generateAudioFromText = async (text) => {
  try {
    const response = await fetch(audioAPI, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const audioBlob = await response.blob();
    console.log("Received audio blob size:", audioBlob.size);
    const url = URL.createObjectURL(audioBlob);
    console.log(url);
    return url;
  } catch (error) {
    console.error("Error generating audio:", error);
    throw error;
  }
};

export const renderAudioWithDownload = (audioUrl) => {
  // Make sure there's a container in your HTML with the ID 'audioContainer'
  const audioContainer = document.getElementById("audioContainer");
  if (!audioContainer) {
    console.error("No element with id 'audioContainer' found.");
    return;
  }
  // Clear any previous content.
  audioContainer.innerHTML = "";

  // Create an audio element.
  const audio = document.createElement("audio");
  audio.controls = true;
  audio.src = audioUrl;
  audio.style.display = "block";
  audioContainer.appendChild(audio);

  // Create a download link for the audio.
  const downloadLink = document.createElement("a");
  downloadLink.href = audioUrl;
  downloadLink.download = "chapter_audio.mp3"; // Change the filename or extension if needed.
  downloadLink.textContent = "Download Audio";
  downloadLink.style.marginTop = "10px";
  downloadLink.style.display = "block";
  audioContainer.appendChild(downloadLink);
};
