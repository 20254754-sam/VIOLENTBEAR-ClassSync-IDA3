import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import { readDbSnapshot, writeDbValue } from '../lib/classsyncDb';

const formatUpdatedAt = (value) => {
  if (!value) {
    return 'No timestamp found';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'No timestamp found';
  }

  return parsedDate.toLocaleString();
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const getItemId = (item) => String(item?.id ?? '');

const RecoveryPage = ({ storageKeys, dbKeys, seedUsers, seedForumPosts }) => {
  const [scanState, setScanState] = useState({
    error: '',
    isRestoring: false,
    isScanning: true,
    report: null,
    restoreMessage: ''
  });

  const seedUserIds = useMemo(() => new Set(seedUsers.map((user) => getItemId(user))), [seedUsers]);
  const seedForumIds = useMemo(() => new Set(seedForumPosts.map((post) => getItemId(post))), [seedForumPosts]);

  const buildDatasetReport = ({ key, localStorageValue, snapshot, seedIdSet }) => {
    const indexedDbItems = toArray(snapshot.localValue);
    const localStorageItems = toArray(localStorageValue);
    const cloudItems = toArray(snapshot.cloudValue);

    const extraLocalStorageItems = localStorageItems.filter((item) => !seedIdSet.has(getItemId(item)));
    const extraIndexedDbItems = indexedDbItems.filter((item) => !seedIdSet.has(getItemId(item)));
    const extraCloudItems = cloudItems.filter((item) => !seedIdSet.has(getItemId(item)));

    return {
      cloudCount: cloudItems.length,
      extraCloudCount: extraCloudItems.length,
      extraIndexedDbCount: extraIndexedDbItems.length,
      extraLocalStorageCount: extraLocalStorageItems.length,
      hasCloudAccess: snapshot.hasCloudAccess,
      indexedDbCount: indexedDbItems.length,
      key,
      localStorageCount: localStorageItems.length,
      localStorageItems,
      indexedDbItems,
      cloudItems
    };
  };

  const runScan = async () => {
    setScanState((currentState) => ({
      ...currentState,
      error: '',
      isScanning: true,
      restoreMessage: ''
    }));

    try {
      const localUsers = JSON.parse(window.localStorage.getItem(storageKeys.users) || 'null');
      const localForum = JSON.parse(window.localStorage.getItem(storageKeys.forum) || 'null');

      const [usersSnapshot, forumSnapshot] = await Promise.all([
        readDbSnapshot(dbKeys.users),
        readDbSnapshot(dbKeys.forum)
      ]);

      const usersReport = buildDatasetReport({
        key: dbKeys.users,
        localStorageValue: localUsers,
        snapshot: usersSnapshot,
        seedIdSet: seedUserIds
      });

      const forumReport = buildDatasetReport({
        key: dbKeys.forum,
        localStorageValue: localForum,
        snapshot: forumSnapshot,
        seedIdSet: seedForumIds
      });

      setScanState((currentState) => ({
        ...currentState,
        isScanning: false,
        report: {
          scannedAt: new Date().toISOString(),
          users: usersReport,
          forum: forumReport
        }
      }));
    } catch (error) {
      setScanState((currentState) => ({
        ...currentState,
        error: error instanceof Error ? error.message : 'Unable to scan browser storage.',
        isScanning: false
      }));
    }
  };

  useEffect(() => {
    runScan();
  }, []);

  const hasRecoverableUsers =
    (scanState.report?.users.extraLocalStorageCount || 0) > 0 || (scanState.report?.users.extraIndexedDbCount || 0) > 0;
  const hasRecoverableForum =
    (scanState.report?.forum.extraLocalStorageCount || 0) > 0 || (scanState.report?.forum.extraIndexedDbCount || 0) > 0;
  const hasRecoverableData = hasRecoverableUsers || hasRecoverableForum;

  const restoreFromThisBrowser = async () => {
    if (!scanState.report) {
      return;
    }

    const preferredUsers =
      scanState.report.users.extraIndexedDbCount >= scanState.report.users.extraLocalStorageCount
        ? scanState.report.users.indexedDbItems
        : scanState.report.users.localStorageItems;

    const preferredForum =
      scanState.report.forum.extraIndexedDbCount >= scanState.report.forum.extraLocalStorageCount
        ? scanState.report.forum.indexedDbItems
        : scanState.report.forum.localStorageItems;

    setScanState((currentState) => ({
      ...currentState,
      error: '',
      isRestoring: true,
      restoreMessage: ''
    }));

    try {
      await Promise.all([
        writeDbValue(dbKeys.users, preferredUsers),
        writeDbValue(dbKeys.forum, preferredForum)
      ]);

      setScanState((currentState) => ({
        ...currentState,
        isRestoring: false,
        restoreMessage: 'Recovery data from this browser was pushed back to Supabase.'
      }));

      await runScan();
    } catch (error) {
      setScanState((currentState) => ({
        ...currentState,
        error: error instanceof Error ? error.message : 'Unable to restore this browser data to Supabase.',
        isRestoring: false
      }));
    }
  };

  const copyReport = async () => {
    if (!scanState.report) {
      return;
    }

    const reportText = JSON.stringify(scanState.report, null, 2);
    await navigator.clipboard.writeText(reportText);
    setScanState((currentState) => ({
      ...currentState,
      restoreMessage: 'Recovery report copied to clipboard.'
    }));
  };

  return (
    <div className="recovery-shell">
      <div className="recovery-card">
        <BrandLogo size="md" className="recovery-brand" />
        <p className="auth-eyebrow">Recovery</p>
        <h1>Browser data scanner</h1>
        <p className="recovery-intro">
          Open this page on each browser or device that used ClassSync before the data disappeared. We are looking for a
          browser that still has extra accounts or forum posts saved locally.
        </p>

        <div className="recovery-actions">
          <button type="button" className="auth-submit-button" onClick={runScan} disabled={scanState.isScanning}>
            {scanState.isScanning ? 'Scanning...' : 'Scan this browser'}
          </button>
          <button type="button" className="recovery-secondary-button" onClick={copyReport} disabled={!scanState.report}>
            Copy report
          </button>
          <Link to="/login" className="recovery-link-button">
            Back to login
          </Link>
        </div>

        {scanState.error && <p className="auth-feedback recovery-feedback">{scanState.error}</p>}
        {scanState.restoreMessage && <p className="auth-feedback recovery-feedback">{scanState.restoreMessage}</p>}

        {scanState.report && (
          <>
            <div className={`recovery-status ${hasRecoverableData ? 'recovery-status-good' : 'recovery-status-empty'}`}>
              <strong>{hasRecoverableData ? 'Recoverable data found on this browser.' : 'No extra local data found here.'}</strong>
              <span>Scanned at {formatUpdatedAt(scanState.report.scannedAt)}</span>
            </div>

            <div className="recovery-grid">
              <section className="recovery-panel">
                <h2>Accounts</h2>
                <p>LocalStorage: {scanState.report.users.localStorageCount}</p>
                <p>IndexedDB: {scanState.report.users.indexedDbCount}</p>
                <p>Supabase: {scanState.report.users.cloudCount}</p>
                <p>Extra local accounts: {Math.max(scanState.report.users.extraLocalStorageCount, scanState.report.users.extraIndexedDbCount)}</p>
              </section>

              <section className="recovery-panel">
                <h2>Forum posts</h2>
                <p>LocalStorage: {scanState.report.forum.localStorageCount}</p>
                <p>IndexedDB: {scanState.report.forum.indexedDbCount}</p>
                <p>Supabase: {scanState.report.forum.cloudCount}</p>
                <p>Extra local posts: {Math.max(scanState.report.forum.extraLocalStorageCount, scanState.report.forum.extraIndexedDbCount)}</p>
              </section>
            </div>

            <div className="recovery-hint-list">
              <p>Good recovery candidate: extra local accounts is greater than 0.</p>
              <p>Good recovery candidate: extra local posts is greater than 0.</p>
              <p>If both are 0, this browser likely no longer has the missing data.</p>
            </div>

            {hasRecoverableData && (
              <div className="recovery-restore-panel">
                <p>This browser looks promising. If the counts match what you expect, we can restore its local users and forum data back into Supabase.</p>
                <button
                  type="button"
                  className="auth-submit-button"
                  onClick={restoreFromThisBrowser}
                  disabled={scanState.isRestoring}
                >
                  {scanState.isRestoring ? 'Restoring...' : 'Restore this browser data to Supabase'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RecoveryPage;
