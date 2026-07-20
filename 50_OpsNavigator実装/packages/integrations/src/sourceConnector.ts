// SourceConnector(§10.4): Gate 2ではmockのみ。外部Drive/Docs/Sheetsへ接続しない。
// 実接続(read-only同期)はGate 3の承認後に別実装として追加する。
export interface SourceMetadata {
  sourceId: string;
  title: string;
  updatedAt: string | null;
}

export class MockSourceConnector {
  readonly mode = "MOCK" as const;

  async listApprovedSources(): Promise<SourceMetadata[]> {
    // DB内のSourceAssetが正。外部照会は行わない。
    return [];
  }

  async fetchMetadata(sourceId: string): Promise<SourceMetadata> {
    return { sourceId, title: "MOCK", updatedAt: null };
  }

  async fetchApprovedContent(_sourceId: string): Promise<never> {
    throw new Error("SOURCE_SYNC_DISABLED: 外部正本の取得はGate 3で承認されるまで無効です。");
  }
}
