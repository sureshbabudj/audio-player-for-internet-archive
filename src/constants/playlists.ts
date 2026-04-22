export interface SourcedPlaylist {
  id: string;
  name: string;
  identifier: string; // Archive.org identifier
  description: string;
  icon: string;
}

export const DEFAULT_PLAYLISTS: SourcedPlaylist[] = [
  {
    id: "tamil-melody-hits",
    name: "Tamil Melody Hits",
    identifier: "tamil-melody-hits",
    description: "Classic Tamil melody songs",
    icon: "solar:music-note-bold-duotone",
  },
  {
    id: "ilayaraja-classics",
    name: "Ilayaraja Classics",
    identifier: "nethu-oruthara",
    description: "Ilayaraja compositions",
    icon: "solar:microphone-bold-duotone",
  },
  {
    id: "ar-rahman-hits",
    name: "A.R. Rahman Hits",
    identifier: "arr_hits_202507",
    description: "Mozart of Madras collection",
    icon: "solar:star-bold-duotone",
  },
  {
    id: "y-2mate.com-celine-dion-a-new-day-has-come-making-the-album",
    name: "Celine Dion - A New Day Has Come (Making the Album)",
    identifier: "y-2mate.com-celine-dion-a-new-day-has-come-making-the-album",
    description: "Celine Dion - A New Day Has Come (Making the Album)",
    icon: "solar:microphone-bold-duotone",
  },
  {
    id: "eminem-pete-rock",
    name: "Eminem and Pete Rock - Marshall and The Soul Brother Blend Tape",
    identifier:
      "Eminem_and_Pete_Rock_-_Marshall_and_The_Soul_Brother_Blend_Tape-2017",
    description:
      "Eminem and Pete Rock - Marshall and The Soul Brother Blend Tape",
    icon: "solar:microphone-bold-duotone",
  },
];
