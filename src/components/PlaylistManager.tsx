import { useState } from "react";
import { Playlist } from "../types";
import Modal from "./Modal";
import { DEFAULT_PLAYLISTS, SourcedPlaylist } from "../constants/playlists";
import { convertToTracks, fetchArchiveMetadata } from "../utils/archiveOrg";
import { Icon } from "@iconify/react";

interface PlaylistManagerProps {
  playlists: Playlist[];
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
  onImportFromArchive: (url: string, name?: string) => Promise<Playlist>;
  onSelect: (playlist: Playlist) => void;
  onPlayPlaylist: (playlist: Playlist) => void;
}

const PlaylistManager: React.FC<PlaylistManagerProps> = ({
  playlists,
  onCreate,
  onDelete,
  onImportFromArchive,
  onSelect,
  onPlayPlaylist,
}) => {
  const [subTab, setSubTab] = useState<"default" | "user">("default");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [archiveUrl, setArchiveUrl] = useState("");
  const [customName, setCustomName] = useState("");
  const [newPlaylistName, setNewPlaylistName] = useState("");

  const [isImporting, setIsImporting] = useState(false);
  const [loadingFeaturedId, setLoadingFeaturedId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      onCreate(newPlaylistName.trim());
      setNewPlaylistName("");
      setIsCreateModalOpen(false);
    }
  };

  const handleImportIA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archiveUrl.trim()) return;

    setIsImporting(true);
    setError(null);
    try {
      await onImportFromArchive(
        archiveUrl.trim(),
        customName.trim() || undefined,
      );
      setArchiveUrl("");
      setCustomName("");
      setIsImportModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to import. Check URL/ID.");
    } finally {
      setIsImporting(false);
    }
  };

  const handlePlayFeatured = async (featured: SourcedPlaylist) => {
    setLoadingFeaturedId(featured.id);
    try {
      const metadata = await fetchArchiveMetadata(featured.identifier);
      const tracks = convertToTracks(metadata);
      onPlayPlaylist({
        id: featured.id,
        name: featured.name,
        tracks,
        createdAt: Date.now(),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFeaturedId(null);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Sub-Tabs */}
      <div className="flex gap-4 border-b border-dark-800/50 px-1">
        <button
          onClick={() => setSubTab("default")}
          className={`pb-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
            subTab === "default"
              ? "text-primary-500 border-b-2 border-primary-500"
              : "text-dark-500 hover:text-white"
          }`}
        >
          Featured
        </button>
        <button
          onClick={() => setSubTab("user")}
          className={`pb-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
            subTab === "user"
              ? "text-primary-500 border-b-2 border-primary-500"
              : "text-dark-500 hover:text-white"
          }`}
        >
          My Collections
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {subTab === "default" ? (
          <div className="grid grid-cols-2 gap-3">
            {DEFAULT_PLAYLISTS.map((f) => (
              <button
                key={f.id}
                onClick={() => handlePlayFeatured(f)}
                disabled={loadingFeaturedId === f.id}
                className="flex flex-col items-start p-4 rounded-2xl bg-dark-900/50 border border-dark-800 hover:border-primary-500/50 hover:bg-dark-800 transition-all text-left relative group overflow-hidden"
              >
                <Icon
                  icon={f.icon}
                  className="w-8 h-8 text-primary-500 mb-3 group-hover:scale-110 transition-transform"
                />
                <h4 className="text-white text-xs font-bold leading-tight mb-1">
                  {f.name}
                </h4>
                <p className="text-dark-500 text-[10px] line-clamp-2">
                  {f.description}
                </p>
                {loadingFeaturedId === f.id && (
                  <div className="absolute inset-0 bg-dark-900/80 flex items-center justify-center">
                    <Icon
                      icon="svg-spinners:180-ring"
                      className="w-6 h-6 text-primary-500"
                    />
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {playlists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-dark-900 flex items-center justify-center mb-4">
                  <Icon
                    icon="solar:folder-music-bold-duotone"
                    className="w-8 h-8 text-dark-700"
                  />
                </div>
                <h4 className="text-white text-sm font-bold mb-1">
                  No collections yet
                </h4>
                <p className="text-dark-500 text-[10px] mb-6 px-8">
                  Import your favorites from Archive.org or create a new
                  playlist.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-primary-500/20"
                  >
                    <Icon icon="solar:import-bold" className="w-4 h-4" />
                    Import IA
                  </button>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95"
                  >
                    <Icon icon="solar:add-circle-bold" className="w-4 h-4" />
                    Create
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold text-dark-500 uppercase tracking-tighter">
                    Your Playlists
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setIsImportModalOpen(true)}
                      className="p-1 text-primary-500 hover:bg-primary-500/10 rounded"
                    >
                      <Icon icon="solar:import-bold" className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="p-1 text-primary-500 hover:bg-primary-500/10 rounded"
                    >
                      <Icon icon="solar:add-circle-bold" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {playlists.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onSelect(p)}
                    className="group flex items-center justify-between p-3 rounded-2xl bg-dark-900/50 hover:bg-dark-800 border border-dark-800 hover:border-primary-500/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center group-hover:bg-primary-500/20 transition-colors">
                        <Icon
                          icon="solar:music-library-2-bold-duotone"
                          className="w-6 h-6 text-primary-500"
                        />
                      </div>
                      <div>
                        <h4 className="text-white text-sm font-semibold">
                          {p.name}
                        </h4>
                        <p className="text-dark-500 text-[10px]">
                          {p.tracks.length} tracks
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayPlaylist(p);
                        }}
                        className="p-2 text-primary-500 hover:text-primary-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Icon
                          icon="solar:play-circle-bold"
                          className="w-6 h-6"
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(p.id);
                        }}
                        className="p-2 text-dark-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Icon
                          icon="solar:trash-bin-minimalistic-bold"
                          className="w-5 h-5"
                        />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-primary-500/20"
                  >
                    <Icon icon="solar:import-bold" className="w-4 h-4" />
                    Import IA
                  </button>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95"
                  >
                    <Icon icon="solar:add-circle-bold" className="w-4 h-4" />
                    Create
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import from Archive.org"
      >
        <form onSubmit={handleImportIA} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-dark-500 uppercase mb-1">
              Archive URL or ID
            </label>
            <input
              type="text"
              autoFocus
              placeholder="e.g. https://archive.org/details/..."
              value={archiveUrl}
              onChange={(e) => setArchiveUrl(e.target.value)}
              className="w-full bg-dark-950 border border-dark-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-dark-500 uppercase mb-1">
              Custom Name (Optional)
            </label>
            <input
              type="text"
              placeholder="My Awesome Collection"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full bg-dark-950 border border-dark-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
          {error && (
            <p className="text-red-500 text-[10px] bg-red-500/10 p-2 rounded-lg">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isImporting}
              className="flex-1 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2"
            >
              {isImporting ? (
                <Icon icon="svg-spinners:180-ring" className="w-5 h-5" />
              ) : (
                <Icon icon="solar:import-bold" className="w-5 h-5" />
              )}
              {isImporting ? "Fetching..." : "Import to Library"}
            </button>
            <button
              type="button"
              disabled={isImporting}
              onClick={async () => {
                if (!archiveUrl.trim()) return;
                setIsImporting(true);
                setError(null);
                try {
                  const newP = await onImportFromArchive(
                    archiveUrl,
                    customName,
                  );
                  onPlayPlaylist(newP);
                  setIsImportModalOpen(false);
                } catch (err: any) {
                  setError(err.message);
                } finally {
                  setIsImporting(false);
                }
              }}
              className="flex-1 bg-dark-800 hover:bg-dark-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Icon icon="solar:play-bold" className="w-5 h-5" />
              Play Now
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Playlist"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-dark-500 uppercase mb-1">
              Playlist Name
            </label>
            <input
              type="text"
              autoFocus
              placeholder="My Favorite Hits"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="w-full bg-dark-950 border border-dark-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary-500/20"
          >
            Create Playlist
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default PlaylistManager;
