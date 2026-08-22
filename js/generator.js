/**
 * 引き継いでみよう。ツール - プロンプト生成エンジン (generator.js)
 * 仕様書第10条・第11条準拠のプロンプト構築モジュール
 */

const PromptGenerator = (() => {
  /**
   * 引き継ぎプロンプトを構築する
   * @param {Object} data 入力データ
   * @param {string} data.project 何を作っているか (プロジェクト概要)
   * @param {string} data.history ここまで何をしたか (作業経緯)
   * @param {string} data.status 今どうなっているか (現在の状態)
   * @param {string} data.next 次に何をしたいか (今後の予定)
   * @param {string} mode 出力形式 ('standard' | 'compact' | 'technical')
   * @param {string} tuning カスタム修正要望
   * @returns {string} 生成されたプロンプト
   */
  function generate(data, mode = 'standard', tuning = '') {
    const project = (data.project || '').trim() || '未記入のプロジェクト';
    const history = (data.history || '').trim() || '特記事項なし';
    const status = (data.status || '').trim() || '特記事項なし';
    const next = (data.next || '').trim() || '特記事項なし';

    let prompt = '';

    // モード別の導入・指示文
    if (mode === 'compact') {
      prompt += `【AI開発引き継ぎ依頼（要約版）】\n`;
      prompt += `以下のプロジェクト状況を踏まえ、次のAIがすぐに開発を再開できるよう、要点を簡潔にまとめた引き継ぎ文書（サマリー）を作成してください。\n`;
    } else if (mode === 'technical') {
      prompt += `【AI開発引き継ぎ依頼（技術・詳細版）】\n`;
      prompt += `以下のプロジェクト状況を精査し、次のAI（エンジニア）へ正確にコンテキストを伝達するための技術的引き継ぎ仕様書を作成してください。\n`;
      prompt += `コード構成、前提条件、発生中のエラーや技術的制約、次に着手すべき実装ステップを論理的かつ具体的に整理してください。\n`;
    } else {
      prompt += `【AI開発引き継ぎ依頼】\n`;
      prompt += `現在進めている開発プロジェクトを別のAIまたは新しいチャットセッションへ引き継ぎたいと考えています。\n`;
      prompt += `以下の「現在のプロジェクト情報」をもとに、次のAIへ渡すための分かりやすい引き継ぎ文書を作成してください。\n`;
    }

    // ユーザーによる追加修正要望の反映
    if (tuning && tuning.trim()) {
      prompt += `\n【追加の調整要望】\n${tuning.trim()}\n`;
    }

    // 入力データセクション
    prompt += `\n--- [現在のプロジェクト情報] ---\n`;
    prompt += `■ 1. 作成しているもの (概要)\n${project}\n\n`;
    prompt += `■ 2. ここまで完了した作業 (経緯)\n${history}\n\n`;
    prompt += `■ 3. 現在の状態・残っている課題\n${status}\n\n`;
    prompt += `■ 4. 次に行いたいこと (予定)\n${next}\n`;
    prompt += `-------------------------------\n\n`;

    // 出力フォーマット指示（仕様書第11条準拠）
    prompt += `【作成してほしい引き継ぎ文書の基本構成】\n`;
    prompt += `以下の見出し構成で、入力された事実のみを正確に整理してください（入力されていない事実を勝手に捏造・補完しないでください）。\n\n`;
    prompt += `\`\`\`markdown\n`;
    prompt += `# プロジェクト引き継ぎ書\n\n`;
    prompt += `## 1. プロジェクト概要\n`;
    prompt += `## 2. 目的・背景\n`;
    prompt += `## 3. 現在の状態\n`;
    prompt += `## 4. 完了したこと\n`;
    prompt += `## 5. 未完了のこと・残課題\n`;
    prompt += `## 6. 現在発生している問題（あれば）\n`;
    prompt += `## 7. 注意事項・技術前提\n`;
    prompt += `## 8. 次にやること（推奨ステップ）\n`;
    prompt += `\`\`\`\n\n`;

    // 締めくくりの指示
    prompt += `それでは、上記構成に沿って引き継ぎ文書を作成してください。よろしくお願いします。`;

    return prompt;
  }

  return {
    generate
  };
})();

// グローバルスコープへの公開
if (typeof window !== 'undefined') {
  window.PromptGenerator = PromptGenerator;
}
