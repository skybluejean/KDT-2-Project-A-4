function newAccountTable(userid: string): string {
  const createAccountTableQuery = `DELIMITER //
  CREATE TABLE \`${userid}_account\` (
    \`accountIndex\` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '계좌 인덱스',
    \`accountDate\` TIMESTAMP NULL DEFAULT current_timestamp() COMMENT '거래 날짜',
    \`accountDeposit\` INT(10) UNSIGNED NULL DEFAULT NULL COMMENT '입금 기록',
    \`accountWithdraw\` INT(10) UNSIGNED NULL DEFAULT NULL COMMENT '출금 기록',
    \`accountBalance\` INT(10) UNSIGNED NOT NULL DEFAULT '0' COMMENT '계좌 잔액',
    \`companyCode\` VARCHAR(15) NOT NULL DEFAULT '' COMMENT '거래한 회사 주 코드' COLLATE 'utf8mb3_general_ci',
    \`shareBuyoutCount\` INT(10) UNSIGNED NULL DEFAULT NULL COMMENT '주식 매수 량',
    \`shareBuyoutPrice\` INT(10) UNSIGNED NULL DEFAULT NULL COMMENT '주식 매수 단가',
    \`shareSelloutCount\` INT(10) UNSIGNED NULL DEFAULT NULL COMMENT '주식 매도 량',
    \`shareSelloutPrice\` INT(10) UNSIGNED NULL DEFAULT NULL COMMENT '주식 매도 단가',
    PRIMARY KEY (\`accountIndex\`) USING BTREE,
    INDEX \`companyCode\` (\`companyCode\`) USING BTREE,
    CONSTRAINT \`fk_${userid}_account_companyCode\` FOREIGN KEY (\`companyCode\`) REFERENCES \`companylist\` (\`code\`) ON UPDATE NO ACTION ON DELETE NO ACTION
  )
  COMMENT='${userid} 사용자용 모의투자 계좌.'
  COLLATE='utf8mb4_unicode_ci'
  ENGINE=InnoDB
  //
  
  CREATE TRIGGER update_balance_trigger
  AFTER INSERT ON \`${userid}_account\` FOR EACH ROW
  BEGIN
    IF NEW.accountDeposit IS NOT NULL THEN
      UPDATE \`${userid}_account\` SET NEW.accountBalance = accountBalance + NEW.accountDeposit WHERE accountIndex = NEW.accountIndex;
    END IF;
    IF NEW.accountWithdraw IS NOT NULL THEN
      UPDATE \`${userid}_account\` SET NEW.accountBalance = accountBalance - NEW.accountWithdraw WHERE accountIndex = NEW.accountIndex;
    END IF;
  END//
  
  CREATE TRIGGER update_stock_balance_trigger
  AFTER INSERT ON \`${userid}_account\` FOR EACH ROW
  BEGIN
    DECLARE stockCount INT;
  
    -- Check if shareBuyoutCount is not null and positive
    IF NEW.shareBuyoutCount IS NOT NULL AND NEW.shareBuyoutCount > 0 THEN
      -- Get stock count for the company code
      SELECT stockBalance INTO stockCount FROM \`${userid}_stocks\` WHERE stockCode = NEW.companyCode;
      
      IF stockCount IS NOT NULL THEN
        -- Update existing stock record
        UPDATE \`${userid}_stocks\` SET stockBalance = stockBalance + NEW.shareBuyoutCount WHERE stockCode = NEW.companyCode;
      ELSE
        -- Insert new stock record
        INSERT INTO \`${userid}_stocks\` (stockCode, stockBalance) VALUES (NEW.companyCode, NEW.shareBuyoutCount);
      END IF;
    END IF;
  
    -- Check if shareSelloutCount is not null and positive
    IF NEW.shareSelloutCount IS NOT NULL AND NEW.shareSelloutCount > 0 THEN
      -- Get stock count for the company code
      SELECT stockBalance INTO stockCount FROM \`${userid}_stocks\` WHERE stockCode = NEW.companyCode;
      
      IF stockCount IS NOT NULL AND stockCount >= NEW.shareSelloutCount THEN
        -- Update existing stock record
        UPDATE \`${userid}_stocks\` SET stockBalance = stockBalance - NEW.shareSelloutCount WHERE stockCode = NEW.companyCode;
      END IF;
    END IF;
  END//
  
  DELIMITER ;`;
  return createAccountTableQuery;
}

function newGachaTable(userid: string): string {
  const createGachaTableQuery = `CREATE TABLE \`${userid}_gacha\` (
          \`gachaIndex\` INT(10) NOT NULL AUTO_INCREMENT COMMENT '가챠 인덱스',
          \`gachaDate\` TIMESTAMP NOT NULL DEFAULT current_timestamp() COMMENT '가챠 날짜',
          \`gachaList\` VARCHAR(300) NOT NULL DEFAULT '' COMMENT '가챠 리스트' COLLATE 'utf8mb4_unicode_ci',
          \`gachaDraw\` VARCHAR(30) NOT NULL DEFAULT '' COMMENT '가챠 결과' COLLATE 'utf8mb4_unicode_ci',
          PRIMARY KEY (\`gachaIndex\`) USING BTREE
      )
      COMMENT='${userid} 사용자의 종목뽑기 기록'
      COLLATE='utf8mb3_general_ci'
      ENGINE=InnoDB
      ;
      `;
  return createGachaTableQuery;
}
function newTodayLuckTable(userid: string): string {
  const createTodayLuckTableQuery = `CREATE TABLE \`${userid}_todayluck\` (
          \`todayDate\` TIMESTAMP NULL DEFAULT current_timestamp() COMMENT '운세 날짜',
          \`todayLuck\` VARCHAR(6) NOT NULL COMMENT '운세 결과' COLLATE 'utf8mb4_unicode_ci',
          \`todayMessage\` VARCHAR(150) NOT NULL COMMENT '운세 설명' COLLATE 'utf8mb4_unicode_ci'
      )
      COMMENT='${userid} 사용자의 오늘의 운세\r\n'
      COLLATE='utf8mb4_unicode_ci'
      ENGINE=InnoDB
      ;
      `;
  return createTodayLuckTableQuery;
}

function newStocksTable(userid: string): string {
  const createStockTableQuery = `CREATE TABLE \`${userid}_stocks\` (
        \`stockCode\` VARCHAR(15) NOT NULL DEFAULT '' COLLATE 'utf8mb3_general_ci',
        \`stockName\` VARCHAR(50) NULL DEFAULT '' COLLATE 'utf8mb3_general_ci',
        \`stockBalance\` INT(10) UNSIGNED NOT NULL DEFAULT '0' COMMENT '보유 주식 양',
        PRIMARY KEY (\`stockCode\`) USING BTREE,
        CONSTRAINT \`fk_${userid}_stock_stockCode\` FOREIGN KEY (\`stockCode\`) REFERENCES \`companylist\` (\`code\`) ON UPDATE NO ACTION ON DELETE NO ACTION
    )
    COMMENT='${userid} 사용자의 보유 주식'
    COLLATE='utf8mb3_general_ci'
    ENGINE=InnoDB
    ;
    `;
  return createStockTableQuery;
}
/**
 * 신규 회원가입시 회원 고유의 데이터를 저장할 개인 DB 테이블을 생성할 명령 쿼리문 배열 API
 * 
 * @param userid 테이블을 생성할 회원 id
 * @returns queries : `string[]` : 신규 회원을 위한 개인 DB 테이블 생성 쿼리문 배열
 */
export default function createTableQueries(userid: string): string[] {
  const queries: string[] = new Array();
  queries.push(newAccountTable(userid));
  queries.push(newStocksTable(userid));
  queries.push(newTodayLuckTable(userid));
  queries.push(newGachaTable(userid));

  return queries;
}
