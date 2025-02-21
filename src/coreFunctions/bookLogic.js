import epub from "epubjs";

const fetchBlobAndConvertToBase64 = async (blobUrl) => {
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result.split(',')[1];
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting blob to base64:", error);
    return null;
  }
};

export const parseEpubFile = (epubFile) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const epubBlob = new Blob([event.target.result], {
          type: "application/epub+zip",
        });
        const epubReader = epub(epubBlob);
        const nav = await epubReader.loaded.navigation;
        const toc = nav.toc;
        const metadata = await epubReader.loaded.metadata;
        
        // Extract cover URL
        let coverBase64 = null;
        await epubReader
          .coverUrl()
          .then((coverBlob) => {
            if (coverBlob) {
              return fetchBlobAndConvertToBase64(coverBlob);
            }
            return null;
          })
          .then((base64) => {
            if (base64) {
              coverBase64 = `data:image/png;base64,${base64}`;
            }
          })
          .catch((error) => {
            console.error("Error processing cover image:", error);
          });
          // console.log(coverBase64)
        coverBase64 = coverBase64 || "https://i.imgur.com/c4VGri2.jpeg";

        resolve({ toc, metadata, epubReader, coverBase64 });
      } catch (error) {
        console.error("Error parsing EPUB file:", error);
        reject(new Error(`Failed to parse EPUB file: ${error.message}`));
      }
    };
    reader.onerror = (error) => {
      console.error("Error reading EPUB file:", error);
      reject(new Error(`Failed to read EPUB file: ${error.message}`));
    };
    reader.readAsArrayBuffer(epubFile);
  });
};
export const populateChapterDropdown = (toc) => {
  const chapterDropdown = document.getElementById("chapterDropdown");
  if (!chapterDropdown) {
    console.error("Chapter dropdown element not found");
    return;
  }
  chapterDropdown.innerHTML = "";

  const addChapterToDropdown = (chapter, index, isSubitem = false) => {
    const option = document.createElement("option");
    option.value = index;
    option.text = `${isSubitem ? "└ " : ""}${chapter.label}`;
    chapterDropdown.add(option);
  };

  toc.forEach((chapter, index) => {
    addChapterToDropdown(chapter, index);

    if (chapter.subitems && chapter.subitems.length > 0) {
      chapter.subitems.forEach((subitem, subitemIdx) => {
        const subitemIndex = `${index}.${subitemIdx}`;
        addChapterToDropdown(subitem, subitemIndex, true);
      });
    }
  });
};

export const getChapterPrompt = async (chapter, epubReader) => {
  if (!chapter || !chapter.href) {
    throw new Error("Invalid chapter data");
  }

  if (!epubReader) {
    throw new Error("EPUB reader not initialized");
  }

  try {
    const displayedChapter = await epubReader
      .renderTo("hiddenDiv")
      .display(chapter.href);
    if (!displayedChapter || !displayedChapter.contents) {
      throw new Error("Failed to render chapter content");
    }
    return displayedChapter.contents.innerText.slice(0, 25000);
  } catch (error) {
    console.error("Error getting chapter prompt:", error);
    throw new Error(`Failed to get chapter prompt: ${error.message}`);
  }
};

export const isNonStoryChapter = (chapterLabel) => {
  const nonStoryLabels = [
    "Title Page",
    "Cover",
    "Dedication",
    "Contents",
    "Copyright",
    "Endorsements",
    "Introduction",
    "Author",
    "About",
    "Map",
  ];
  return nonStoryLabels.some((label) =>
    chapterLabel.toLowerCase().includes(label.toLowerCase())
  );
};

export const getNextChapter = (
  toc,
  currentChapterIndex,
  currentSubitemIndex
) => {
  if (!Array.isArray(toc) || toc.length === 0) {
    throw new Error("Invalid table of contents");
  }

  let nextChapterIndex = currentChapterIndex;
  let nextSubitemIndex = currentSubitemIndex + 1;

  const currentChapter = toc[nextChapterIndex];
  if (!currentChapter) {
    throw new Error("Invalid current chapter index");
  }

  if (currentChapter.subitems && currentChapter.subitems.length > 0) {
    if (nextSubitemIndex >= currentChapter.subitems.length) {
      nextChapterIndex++;
      nextSubitemIndex = 0;
    }
  } else {
    nextChapterIndex++;
    nextSubitemIndex = 0;
  }

  if (nextChapterIndex >= toc.length) {
    return null; // End of book
  }

  return { nextChapterIndex, nextSubitemIndex };
};