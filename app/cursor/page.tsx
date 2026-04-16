"use client";

import { useEffect, useRef, useState } from "react";
import mqtt, { MqttClient } from "mqtt";

type Cursor = {
    id: string;
    x: number;
    y: number;
    color: string;
    ts: number;
    name: string;
};

// Funzione per generare nome alfanumerico casuale
const randomAlphaNum = (length = 6) => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
};

export default function Home() {
    const clientRef = useRef<MqttClient | null>(null);
    const [cursors, setCursors] = useState<Record<string, Cursor>>({});
    const [identity] = useState<{ id: string; color: string; name: string }>(() => ({
        id: Math.random().toString(16).slice(2),
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        name: randomAlphaNum(),
    }));

    // ID utente e nickname casuali (inizializzati dopo il mount per evitare impurità in render)
    const topic = "cursor/mqtt-demo-classe";

    // Connetti MQTT
    useEffect(() => {
        const client = mqtt.connect("wss://broker.hivemq.com:8884/mqtt");

        client.on("connect", () => {
            console.log("Connesso MQTT");
            client.subscribe(topic);
        });

        client.on("message", (_topic: string, message: Buffer) => {
            try {
                const data: Cursor = JSON.parse(message.toString());
                setCursors((prev) => ({
                    ...prev,
                    [data.id]: data,
                }));
            } catch (err) {
                console.error("Errore parsing", err);
            }
        });

        clientRef.current = client;

        return () => {
            client.end();
        };
    }, []);

    // Invia posizione mouse
    useEffect(() => {
        let lastSent = 0;

        const handleMove = (e: MouseEvent) => {
            const now = Date.now();
            if (now - lastSent < 50) return; // throttle
            lastSent = now;

            if (!clientRef.current) return;

            const payload: Cursor = {
                id: identity.id,
                x: e.clientX,
                y: e.clientY,
                color: identity.color,
                ts: Date.now(),
                name: identity.name,
            };

            clientRef.current.publish(topic, JSON.stringify(payload));
        };

        window.addEventListener("mousemove", handleMove);
        return () => window.removeEventListener("mousemove", handleMove);
    }, [identity]);

    // Pulizia cursori inattivi
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setCursors((prev) => {
                const updated: Record<string, Cursor> = {};
                for (const id in prev) {
                    if (now - prev[id].ts < 2000) {
                        updated[id] = prev[id];
                    }
                }
                return updated;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ height: "100vh", backgroundColor: "#f0f0f0" }}>
            <h2 style={{ position: "fixed", top: 10, left: 10 }}>
                MQTT Cursor Demo
            </h2>

            {Object.values(cursors).map((c) =>
                c.id !== identity.id ? (
                    <div
                        key={c.id}
                        style={{
                            position: "absolute",
                            left: c.x,
                            top: c.y,
                            transform: "translate(-50%, -50%)",
                            pointerEvents: "none",
                            textAlign: "center",
                        }}
                    >
                        {/* Nome sopra il cursore */}
                        <div
                            style={{
                                fontSize: 12,
                                color: "#000",
                                backgroundColor: "#fff",
                                padding: "0 4px",
                                borderRadius: 4,
                                fontWeight: "bold",
                                border: `1px solid ${c.color}`,
                                marginBottom: 2,
                                whiteSpace: "nowrap",
                            }}
                        >
                            {c.name}
                        </div>

                        {/* Pallino del cursore con bordo */}
                        <div
                            style={{
                                width: 14,
                                height: 14,
                                borderRadius: "50%",
                                background: c.color,
                                border: "2px solid #000",
                            }}
                        />
                    </div>
                ) : null
            )}
        </div>
    );
}
