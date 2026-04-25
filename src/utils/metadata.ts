import jsmediatags from "jsmediatags";

export const getEmbeddedArtwork = async (
  url: string,
): Promise<string | null> => {
  return new Promise((resolve) => {
    // jsmediatags works by fetching parts of the file using HTTP Range headers
    new jsmediatags.Reader(url).read({
      onSuccess: (tag) => {
        const { picture } = tag.tags;
        if (picture) {
          const { data, format } = picture;

          // Convert the byte array to a base64 string
          try {
            // In modern JS/TS, we can use Buffer if available,
            // but for portability in RN we'll use a standard loop if needed.
            // Using Uint8Array for efficiency
            const uint8Array = new Uint8Array(data);
            let binary = "";
            const len = uint8Array.byteLength;
            for (let i = 0; i < len; i++) {
              binary += String.fromCharCode(uint8Array[i]);
            }

            // btoa is available in Expo/RN environments usually
            // or via global polyfills if using certain libraries.
            const base64 =
              typeof btoa !== "undefined"
                ? btoa(binary)
                : Buffer.from(uint8Array).toString("base64");

            resolve(`data:${format};base64,${base64}`);
          } catch (err) {
            console.error("Error converting artwork to base64:", err);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      },
      onError: (error) => {
        console.warn(
          "jsmediatags error (possibly no tags or range header issue):",
          error,
        );
        resolve(null);
      },
    });
  });
};
