import { useEffect, useMemo, useState } from "react";
import type { Course, Video } from "./types";
import { CATEGORIES, SEED_COURSES } from "./types";
import { parseVideoLink } from "./utils";
import { Background } from "./components/Background";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { FilterBar } from "./components/FilterBar";
import { CourseCard } from "./components/CourseCard";
import { PlayerView } from "./components/PlayerView";
import { AdminPanel } from "./components/AdminPanel";
import { Footer } from "./components/Footer";
import { FolderModal } from "./components/FolderModal";
import { VideoModal } from "./components/VideoModal";

const STORAGE_KEY = "su_premium";

export default function App() {
  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored) as Course[];
    } catch {
      /* ignore */
    }
    return SEED_COURSES;
  });

  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"user" | "admin">("user");
  const [focusMode, setFocusMode] = useState(false);

  const [openCourseId, setOpenCourseId] = useState<string | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [inPlayer, setInPlayer] = useState(false);

  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Course | null>(null);
  const [fTitle, setFTitle] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fThumbUrl, setFThumbUrl] = useState("");
  const [fThumbFile, setFThumbFile] = useState("");
  const [fCategory, setFCategory] = useState("Maths");

  const [adminFolderId, setAdminFolderId] = useState<string | null>(null);

  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [vTitle, setVTitle] = useState("");
  const [vDesc, setVDesc] = useState("");
  const [vLink, setVLink] = useState("");
  const [vVideoFile, setVVideoFile] = useState("");
  const [vDur, setVDur] = useState("");
  const [vThumbUrl, setVThumbUrl] = useState("");
  const [vThumbFile, setVThumbFile] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const catMatch = activeCategory === "all" || c.cat === activeCategory;
      const q = search.toLowerCase();
      const searchMatch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.desc.toLowerCase().includes(q) ||
        c.cat.toLowerCase().includes(q);
      return catMatch && searchMatch;
    });
  }, [courses, activeCategory, search]);

  const openCourse = courses.find((c) => c.id === openCourseId) || null;
  const currentVideo =
    openCourse?.videos.find((v) => v.id === currentVideoId) || null;
  const adminEditingCourse =
    courses.find((c) => c.id === adminFolderId) || null;

  function openPlayer(courseId: string) {
    setOpenCourseId(courseId);
    const first = courses.find((c) => c.id === courseId)?.videos[0];
    if (first) setCurrentVideoId(first.id);
    setInPlayer(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function selectVideo(videoId: string) {
    setCurrentVideoId(videoId);
  }

  function backToCourses() {
    setInPlayer(false);
  }

  function openFolderModal(course?: Course) {
    if (course) {
      setEditingFolder(course);
      setFTitle(course.title);
      setFDesc(course.desc);
      setFThumbUrl(course.thumb);
      setFThumbFile("");
      setFCategory(course.cat);
    } else {
      setEditingFolder(null);
      setFTitle("");
      setFDesc("");
      setFThumbUrl("");
      setFThumbFile("");
      setFCategory("Maths");
    }
    setFolderModalOpen(true);
  }

  function saveFolder() {
    const thumb = fThumbFile || fThumbUrl;
    if (!fTitle.trim()) return;
    if (editingFolder) {
      setCourses((prev) =>
        prev.map((c) =>
          c.id === editingFolder.id
            ? { ...c, title: fTitle, desc: fDesc, thumb, cat: fCategory }
            : c
        )
      );
    } else {
      const newCourse: Course = {
        id: "f_" + Date.now(),
        title: fTitle,
        desc: fDesc,
        thumb,
        cat: fCategory,
        videos: [],
      };
      setCourses((prev) => [newCourse, ...prev]);
    }
    setFolderModalOpen(false);
  }

  function deleteFolder(id: string) {
    if (!confirm("Delete this course permanently?")) return;
    setCourses((prev) => prev.filter((c) => c.id !== id));
    if (openCourseId === id) setInPlayer(false);
  }

  function manageVideos(id: string) {
    setAdminFolderId(id);
  }

  function openVideoModal(video?: Video) {
    if (video) {
      setEditingVideo(video);
      setVTitle(video.title);
      setVDesc(video.desc);
      setVLink(video.link);
      setVVideoFile("");
      setVDur(video.dur);
      setVThumbUrl(video.thumb);
      setVThumbFile("");
    } else {
      setEditingVideo(null);
      setVTitle("");
      setVDesc("");
      setVLink("");
      setVVideoFile("");
      setVDur("");
      setVThumbUrl("");
      setVThumbFile("");
    }
    setVideoModalOpen(true);
  }

  function saveVideo() {
    if (!adminFolderId) return;
    if (!vTitle.trim()) return;
    const effectiveLink = vVideoFile || vLink;
    if (!effectiveLink) return;
    const parsed = parseVideoLink(effectiveLink);
    const thumb = vThumbFile || vThumbUrl;
    const video: Video = {
      id: editingVideo ? editingVideo.id : "v_" + Date.now(),
      title: vTitle,
      desc: vDesc,
      link: effectiveLink,
      type: parsed.type,
      embed: parsed.embed,
      dur: vDur || "00:00",
      thumb,
    };
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== adminFolderId) return c;
        if (editingVideo) {
          return {
            ...c,
            videos: c.videos.map((v) =>
              v.id === editingVideo.id ? video : v
            ),
          };
        }
        return { ...c, videos: [...c.videos, video] };
      })
    );
    setVideoModalOpen(false);
  }

  function deleteVideo(videoId: string) {
    if (!adminFolderId) return;
    if (!confirm("Remove this video?")) return;
    setCourses((prev) =>
      prev.map((c) =>
        c.id === adminFolderId
          ? { ...c, videos: c.videos.filter((v) => v.id !== videoId) }
          : c
      )
    );
  }

  function handleFooterCategory(cat: string) {
    setView("user");
    setActiveCategory(cat);
    setInPlayer(false);
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="min-h-screen bg-[#030805] text-zinc-100 selection:bg-amber-300/30 relative overflow-clip">
      <Background />

      <Header
        focusMode={focusMode}
        toggleFocus={() => setFocusMode((v) => !v)}
        view={view}
        toggleView={() => setView((v) => (v === "user" ? "admin" : "user"))}
      />

      <main className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-28">
        {view === "user" && (
          <div>
            {!inPlayer && (
              <>
                <Hero focusMode={focusMode} />
                <FilterBar
                  active={activeCategory}
                  setActive={setActiveCategory}
                  search={search}
                  setSearch={setSearch}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map((c, idx) => (
                    <CourseCard
                      key={c.id}
                      course={c}
                      index={idx}
                      onOpen={openPlayer}
                    />
                  ))}
                </div>
                {filteredCourses.length === 0 && (
                  <div className="mt-10">
                    <div className="glass rounded-[20px] border border-white/10 p-10 text-center">
                      <div className="mx-auto h-12 w-12 rounded-2xl bg-white/5 border border-white/10 grid place-items-center text-xl">
                        ◍
                      </div>
                      <p className="mt-4 font-semibold">No courses found</p>
                      <p className="mt-1 text-[13px] text-white/50">
                        Try a different search or category. Add courses from
                        Admin.
                      </p>
                      <button
                        onClick={() => {
                          setActiveCategory("all");
                          setSearch("");
                        }}
                        className="mt-4 h-9 rounded-full px-4 bg-white text-black text-[13px] font-bold"
                      >
                        Clear filters
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {inPlayer && (
              <PlayerView
                course={openCourse}
                currentVideo={currentVideo}
                onSelectVideo={selectVideo}
                onBack={backToCourses}
              />
            )}
          </div>
        )}

        {view === "admin" && (
          <AdminPanel
            courses={courses}
            editingFolderId={adminFolderId}
            onEditFolder={openFolderModal}
            onDeleteFolder={deleteFolder}
            onManageVideos={manageVideos}
            onBackToFolders={() => setAdminFolderId(null)}
            onAddVideo={() => openVideoModal()}
            onEditVideo={(videoId) => {
              const v = adminEditingCourse?.videos.find(
                (vid) => vid.id === videoId
              );
              if (v) openVideoModal(v);
            }}
            onDeleteVideo={deleteVideo}
          />
        )}
      </main>

      <Footer onCategoryClick={handleFooterCategory} />

      <FolderModal
        open={folderModalOpen}
        editing={editingFolder}
        title={fTitle}
        setTitle={setFTitle}
        desc={fDesc}
        setDesc={setFDesc}
        thumbUrl={fThumbUrl}
        setThumbUrl={setFThumbUrl}
        thumbFile={fThumbFile}
        setThumbFile={setFThumbFile}
        category={fCategory}
        setCategory={setFCategory}
        onClose={() => setFolderModalOpen(false)}
        onSave={saveFolder}
      />

      <VideoModal
        open={videoModalOpen}
        editing={editingVideo}
        title={vTitle}
        setTitle={setVTitle}
        desc={vDesc}
        setDesc={setVDesc}
        link={vLink}
        setLink={setVLink}
        videoFile={vVideoFile}
        setVideoFile={setVVideoFile}
        duration={vDur}
        setDuration={setVDur}
        thumbUrl={vThumbUrl}
        setThumbUrl={setVThumbUrl}
        thumbFile={vThumbFile}
        setThumbFile={setVThumbFile}
        onClose={() => setVideoModalOpen(false)}
        onSave={saveVideo}
      />
    </div>
  );
}
