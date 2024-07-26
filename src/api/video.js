import axios from "axios";

export const fetchVideos = async () => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_CONNECTION_LINK}/videos`
    );
    return response.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};
