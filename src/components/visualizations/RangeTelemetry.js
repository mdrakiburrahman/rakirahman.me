import React from "react"
import PropTypes from "prop-types"
import styles from "./visualizations.module.css"

const formatBytes = bytes =>
  bytes >= 1000000
    ? `${(bytes / 1000000).toFixed(2)} MB`
    : `${Math.round(bytes / 1000)} KB`

const formatDuration = duration =>
  duration >= 1000
    ? `${(duration / 1000).toFixed(2)} s`
    : `${Math.round(duration)} ms`

const RangeTelemetry = ({
  loading,
  requests,
  bytes,
  cacheHits,
  totalBytes,
  byteLength,
  duration,
}) => (
  <div className={styles.telemetry} aria-live="polite">
    <div className={styles.telemetryDuration}>
      {loading
        ? "fetching..."
        : duration == null
        ? " "
        : `fetched in ${formatDuration(duration)}`}
    </div>
    <div className={styles.telemetryDetails}>
      {requests === 0 && !loading
        ? "0 range requests - served from the client cache"
        : `${requests} range request${
            requests === 1 ? "" : "s"
          } - ${formatBytes(bytes)} fetched`}
      {" - "}
      {((100 * totalBytes) / byteLength).toFixed(1)}% of the cube so far
      {cacheHits > 0
        ? ` - ${cacheHits} cache hit${cacheHits === 1 ? "" : "s"}`
        : ""}
    </div>
  </div>
)

RangeTelemetry.propTypes = {
  loading: PropTypes.bool.isRequired,
  requests: PropTypes.number.isRequired,
  bytes: PropTypes.number.isRequired,
  cacheHits: PropTypes.number.isRequired,
  totalBytes: PropTypes.number.isRequired,
  byteLength: PropTypes.number.isRequired,
  duration: PropTypes.number,
}

export default React.memo(RangeTelemetry)
