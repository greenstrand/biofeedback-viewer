import { useState } from "react";

export default function WebSerialTest() {
  const [port, setPort] = useState(null);
  const [status, setStatus] = useState("Not connected");
  const [log, setLog] = useState([]);
  const [reader, setReader] = useState(null);

  const addLog = (message) => {
    setLog((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const connectToDevice = async () => {
    try {
      // Check if Web Serial is supported
      if (!("serial" in navigator)) {
        addLog("❌ Web Serial API not supported in this browser");
        setStatus("Unsupported browser");
        return;
      }

      addLog("🔍 Requesting serial port...");

      // Request port from user
      const selectedPort = await navigator.serial.requestPort();
      addLog("✅ Port selected");

      // Open the port
      await selectedPort.open({
        baudRate: 9600, // Adjust based on MR-20 specs
      });
      addLog("✅ Port opened at 9600 baud");

      setPort(selectedPort);
      setStatus("Connected");

      // Start reading (basic example)
      readData(selectedPort);
    } catch (error) {
      addLog(`❌ Error: ${error.message}`);
      setStatus("Connection failed");
    }
  };

  const readData = async (selectedPort) => {
    try {
      const portReader = selectedPort.readable.getReader();
      setReader(portReader);
      addLog("📡 Started reading data...");

      while (true) {
        const { value, done } = await portReader.read();
        if (done) {
          addLog("📭 Reader closed");
          break;
        }

        // Log raw bytes (hex format)
        const hex = Array.from(value)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" ");
        addLog(
          `📥 Received ${value.length} bytes: ${hex.substring(0, 50)}${hex.length > 50 ? "..." : ""}`,
        );
      }

      portReader.releaseLock();
      setReader(null);
    } catch (error) {
      if (error.message.includes("cancel")) {
        addLog("📭 Reader cancelled");
      } else {
        addLog(`❌ Read error: ${error.message}`);
      }
      setReader(null);
    }
  };

  const disconnect = async () => {
    if (port) {
      try {
        // Cancel and release the reader first
        if (reader) {
          await reader.cancel();
          reader.releaseLock();
          setReader(null);
        }

        await port.close();
        setPort(null);
        setStatus("Disconnected");
        addLog("🔌 Disconnected");
      } catch (error) {
        addLog(`❌ Disconnect error: ${error.message}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">
          Pathway MR-20 Web Serial Test
        </h1>
        <p className="text-gray-400 mb-8">
          Testing USB-to-Serial connection via Web Serial API
        </p>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-gray-400">Status: </span>
              <span
                className={`font-semibold ${
                  status === "Connected"
                    ? "text-green-400"
                    : status === "Not connected"
                      ? "text-gray-400"
                      : "text-red-400"
                }`}
              >
                {status}
              </span>
            </div>

            <div className="space-x-3">
              {!port ? (
                <button
                  onClick={connectToDevice}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold transition"
                >
                  Connect Device
                </button>
              ) : (
                <button
                  onClick={disconnect}
                  className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-semibold transition"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-500">
            {!("serial" in navigator) && (
              <p className="text-yellow-400">
                ⚠️ Use Chrome, Edge, or Opera to access Web Serial API
              </p>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-3">Activity Log</h2>
          <div className="bg-black rounded p-4 h-96 overflow-y-auto font-mono text-sm">
            {log.length === 0 ? (
              <p className="text-gray-600">
                No activity yet. Click "Connect Device" to start.
              </p>
            ) : (
              log.map((entry, i) => (
                <div key={i} className="mb-1 text-green-400">
                  {entry}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>
            💡 <strong>Note:</strong> You'll need to select the correct COM port
            when prompted.
          </p>
          <p>
            💡 Baud rate is set to 9600 - adjust in code if MR-20 uses different
            settings.
          </p>
        </div>
      </div>
    </div>
  );
}
