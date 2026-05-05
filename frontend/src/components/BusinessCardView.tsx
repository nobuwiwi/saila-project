import type { BusinessCard, ParsedData } from '../types';

interface BusinessCardViewProps {
  card: BusinessCard;
  accentColor?: string;
  /** 縮小表示（テーブルサムネイル用）か、フルサイズ（ドロワー用）か */
  size?: 'mini' | 'full';
}

/**
 * parsed_data を名刺風カードとして HTML で再現するコンポーネント。
 * 名刺の縦横比 (91mm × 55mm ≒ 1.655:1) を維持する。
 */
export function BusinessCardView({ card, accentColor = '#6366f1', size = 'full' }: BusinessCardViewProps) {
  const { analysis_status, parsed_data } = card;
  const isMini = size === 'mini';

  // スケルトン表示（解析中 / 解析待ち）
  if (analysis_status === 'pending' || analysis_status === 'processing') {
    return <SkeletonCard accentColor={accentColor} isMini={isMini} />;
  }

  // データが空（解析失敗 or 未解析で parsed_data が null/空）
  const isEmpty = !parsed_data || !Object.values(parsed_data).some(Boolean);
  if (isEmpty) {
    return <EmptyCard status={analysis_status} accentColor={accentColor} isMini={isMini} />;
  }

  return <FilledCard data={parsed_data} accentColor={accentColor} isMini={isMini} />;
}

// =====================================================================
// 名刺カード本体
// =====================================================================
function FilledCard({
  data,
  accentColor,
  isMini,
}: {
  data: ParsedData;
  accentColor: string;
  isMini: boolean;
}) {
  const phone = data.phone || data.mobile;

  if (isMini) {
    return (
      <div style={miniCardStyle()}>
        {/* アクセントライン */}
        <div style={{ width: 3, backgroundColor: accentColor, alignSelf: 'stretch', borderRadius: '2px 0 0 2px', flexShrink: 0 }} />
        <div style={{ flex: 1, padding: '5px 6px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1 }}>
          {data.company_name && (
            <div style={{ fontSize: 7, color: '#888', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {data.company_name}
            </div>
          )}
          <div style={{ fontSize: 10, fontWeight: 600, color: '#111', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {data.full_name || '—'}
          </div>
          {data.title && (
            <div style={{ fontSize: 7, color: '#777', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {data.title}
            </div>
          )}
        </div>
      </div>
    );
  }

  // フルサイズ
  return (
    <div style={fullCardStyle()}>
      {/* 左アクセントライン */}
      <div style={{ width: 4, backgroundColor: accentColor, alignSelf: 'stretch', borderRadius: '4px 0 0 4px', flexShrink: 0 }} />

      <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 0 }}>
        {/* 上部：会社名 */}
        <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5, marginBottom: 8 }}>
          {data.company_name || ''}
          {data.department && (
            <span style={{ marginLeft: 8, fontSize: 11, color: '#999' }}>{data.department}</span>
          )}
        </div>

        {/* 中央：氏名・役職 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#111', lineHeight: 1.4, marginBottom: 4 }}>
            {data.full_name || '—'}
          </div>
          {data.title && (
            <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{data.title}</div>
          )}
        </div>

        {/* 下部：連絡先 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 12 }}>
          {phone && (
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.4 }}>{phone}</div>
          )}
          {data.mobile && data.phone && data.mobile !== data.phone && (
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.4 }}>{data.mobile}</div>
          )}
          {data.email && (
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.4 }}>{data.email}</div>
          )}
          {data.address && (
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.4 }}>{data.address}</div>
          )}
          {data.website && (
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.4 }}>{data.website}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// スケルトンローディング
// =====================================================================
function SkeletonCard({ accentColor, isMini }: { accentColor: string; isMini: boolean }) {
  if (isMini) {
    return (
      <div style={miniCardStyle()}>
        <div style={{ width: 3, backgroundColor: accentColor, alignSelf: 'stretch', borderRadius: '2px 0 0 2px', flexShrink: 0 }} />
        <div style={{ flex: 1, padding: '5px 6px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <SkeletonBar width="60%" height={6} />
          <SkeletonBar width="80%" height={9} />
          <SkeletonBar width="50%" height={6} />
        </div>
      </div>
    );
  }

  return (
    <div style={fullCardStyle()}>
      <div style={{ width: 4, backgroundColor: accentColor, alignSelf: 'stretch', borderRadius: '4px 0 0 4px', flexShrink: 0 }} />
      <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ marginBottom: 12 }}>
          <SkeletonBar width="45%" height={12} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
          <SkeletonBar width="60%" height={20} />
          <SkeletonBar width="38%" height={12} />
        </div>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <SkeletonBar width="50%" height={10} />
          <SkeletonBar width="65%" height={10} />
        </div>
      </div>
    </div>
  );
}

function SkeletonBar({ width, height }: { width: string | number; height: number }) {
  return (
    <div
      style={{
        width,
        height,
        backgroundColor: '#e5e5e5',
        borderRadius: 3,
        animation: 'saila-pulse 1.4s ease-in-out infinite',
      }}
    />
  );
}

// =====================================================================
// 空状態（解析失敗 or データなし）
// =====================================================================
function EmptyCard({
  status,
  accentColor,
  isMini,
}: {
  status: BusinessCard['analysis_status'];
  accentColor: string;
  isMini: boolean;
}) {
  const label = status === 'failed' ? '解析失敗' : '解析待ち';
  const labelColor = status === 'failed' ? '#dc2626' : '#9ca3af';

  if (isMini) {
    return (
      <div style={{ ...miniCardStyle(), alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 3, backgroundColor: accentColor, alignSelf: 'stretch', borderRadius: '2px 0 0 2px', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 7, color: labelColor }}>{label}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...fullCardStyle(), alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 4, backgroundColor: accentColor, alignSelf: 'stretch', borderRadius: '4px 0 0 4px', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 13, color: labelColor }}>{label}</span>
      </div>
    </div>
  );
}

// =====================================================================
// 共通スタイル
// =====================================================================
const BASE_CARD_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e5e5',
  borderRadius: 4,
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  overflow: 'hidden',
  fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
  position: 'relative',
};

function miniCardStyle(): React.CSSProperties {
  return {
    ...BASE_CARD_STYLE,
    // 91:55 比率 → 幅120px で高さ≒72px
    width: 120,
    height: 72,
  };
}

function fullCardStyle(): React.CSSProperties {
  return {
    ...BASE_CARD_STYLE,
    // 91:55 比率をアスペクト比で維持
    width: '100%',
    aspectRatio: '91 / 55',
    minHeight: 120,
  };
}
