import { addPropertyControls, ControlType } from "framer"
import { useEffect, useRef, useState } from "react"

declare global {
    interface Window {
        YT: any
        onYouTubeIframeAPIReady: () => void
    }
}

export default function VideoPlayer({ youtubeId, style }: { youtubeId: string; style?: React.CSSProperties }) {
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const playerRef = useRef<any>(null)
    const apiReady = useRef(false)
    const seekingRef = useRef(false)

    const [ready, setReady] = useState(false)
    const [playing, setPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(80)
    const [showThumb, setShowThumb] = useState(true)

    useEffect(() => {
        if (!youtubeId) return
        if (window.YT?.Player) { apiReady.current = true; return }

        const s = document.createElement("script")
        s.src = "https://www.youtube.com/iframe_api"
        document.head.appendChild(s)

        const poll = setInterval(() => {
            if (window.YT?.Player) { apiReady.current = true; clearInterval(poll) }
        }, 100)
        return () => clearInterval(poll)
    }, [youtubeId])

    function startPlayer() {
        if (!apiReady.current || !iframeRef.current) return

        const origin = location.origin && location.origin !== "null"
            ? "&origin=" + encodeURIComponent(location.origin) : ""
        iframeRef.current.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&controls=0&enablejsapi=1&rel=0&modestbranding=1${origin}`

        playerRef.current = new window.YT.Player(iframeRef.current, {
            events: {
                onReady: () => {
                    setReady(true)
                    playerRef.current.setVolume(volume)
                    setInterval(() => {
                        if (!playerRef.current || seekingRef.current) return
                        setCurrentTime(playerRef.current.getCurrentTime() || 0)
                        setDuration(playerRef.current.getDuration() || 0)
                    }, 250)
                },
                onStateChange: (e: any) => {
                    setPlaying(e.data === window.YT.PlayerState.PLAYING)
                    if (e.data === window.YT.PlayerState.ENDED) {
                        playerRef.current.seekTo(0)
                        playerRef.current.pauseVideo()
                    }
                },
            },
        })

        setShowThumb(false)
    }

    function fmt(s: number) {
        return Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0")
    }

    return (
        <div style={{ width: "100%", background: "#000", ...style }}>
            {/* Video */}
            <div style={{ position: "relative", aspectRatio: "16/9" }}>
                <iframe
                    ref={iframeRef}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                />
                {showThumb && (
                    <div
                        onClick={startPlayer}
                        style={{
                            position: "absolute", inset: 0, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                    >
                        <img
                            src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
                            style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute" }}
                        />
                        <div style={{
                            position: "relative", zIndex: 1, width: 64, height: 64, borderRadius: "50%",
                            background: "rgba(255,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <svg viewBox="0 0 24 24" style={{ fill: "white", width: 28, height: 28, marginLeft: 4 }}>
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#111" }}>
                <button
                    onClick={() => {
                        if (!playerRef.current) { startPlayer(); return }
                        if (!ready) return
                        playing ? playerRef.current.pauseVideo() : playerRef.current.playVideo()
                    }}
                    style={{ background: "none", border: "1px solid #fff", color: "#fff", padding: "6px 12px", fontSize: 16, cursor: "pointer", flexShrink: 0 }}
                >
                    {playing ? "⏸" : "▶"}
                </button>
                <input
                    type="range" min={0} max={1000}
                    value={duration ? (currentTime / duration) * 1000 : 0}
                    onMouseDown={() => { seekingRef.current = true }}
                    onMouseUp={() => { seekingRef.current = false }}
                    onChange={(e) => {
                        if (!ready || !playerRef.current) return
                        playerRef.current.seekTo((+e.target.value / 1000) * duration, true)
                    }}
                    style={{ flex: 1, cursor: "pointer", accentColor: "#f00" }}
                />
                <input
                    type="range" min={0} max={100} value={volume}
                    onChange={(e) => {
                        setVolume(+e.target.value)
                        if (ready && playerRef.current) playerRef.current.setVolume(+e.target.value)
                    }}
                    style={{ width: 80, cursor: "pointer", accentColor: "#fff" }}
                />
                <span style={{ color: "#fff", fontSize: 12, minWidth: 80, textAlign: "right", flexShrink: 0 }}>
                    {fmt(currentTime)} / {fmt(duration)}
                </span>
            </div>
        </div>
    )
}

addPropertyControls(VideoPlayer, {
    youtubeId: {
        type: ControlType.String,
        title: "YouTube ID",
        defaultValue: "",
    },
})
