from collections.abc import Mapping

from fastapi import Request

from app.core.config import DEFAULT_LOCALE, SUPPORTED_LOCALES


ERROR_TRANSLATIONS: Mapping[str, Mapping[str, str]] = {
    "Email is already registered": {
        "ru": "Этот email уже зарегистрирован",
        "de": "Diese E-Mail-Adresse ist bereits registriert",
        "ja": "このメールアドレスはすでに登録されています",
        "fr": "Cette adresse e-mail est déjà enregistrée",
    },
    "Unknown currency": {
        "ru": "Неизвестная валюта",
        "de": "Unbekannte Währung",
        "ja": "不明な通貨です",
        "fr": "Devise inconnue",
    },
    "Invalid email or password": {
        "ru": "Неверный email или пароль",
        "de": "E-Mail-Adresse oder Passwort ist ungültig",
        "ja": "メールアドレスまたはパスワードが正しくありません",
        "fr": "Adresse e-mail ou mot de passe incorrect",
    },
    "User account is unavailable": {
        "ru": "Аккаунт пользователя недоступен",
        "de": "Das Benutzerkonto ist nicht verfügbar",
        "ja": "ユーザーアカウントを利用できません",
        "fr": "Le compte utilisateur est indisponible",
    },
    "Unsupported locale": {
        "ru": "Этот язык не поддерживается",
        "de": "Diese Sprache wird nicht unterstützt",
        "ja": "この言語はサポートされていません",
        "fr": "Cette langue n’est pas prise en charge",
    },
    "Address not found": {
        "ru": "Адрес не найден",
        "de": "Adresse nicht gefunden",
        "ja": "住所が見つかりません",
        "fr": "Adresse introuvable",
    },
    "Product not found": {
        "ru": "Товар не найден",
        "de": "Produkt nicht gefunden",
        "ja": "商品が見つかりません",
        "fr": "Produit introuvable",
    },
    "Insufficient stock": {
        "ru": "Недостаточно товара в наличии",
        "de": "Nicht genügend Bestand",
        "ja": "在庫が不足しています",
        "fr": "Stock insuffisant",
    },
    "Cart item not found": {
        "ru": "Позиция корзины не найдена",
        "de": "Warenkorbposition nicht gefunden",
        "ja": "カートの商品が見つかりません",
        "fr": "Article du panier introuvable",
    },
    "Order not found": {
        "ru": "Заказ не найден",
        "de": "Bestellung nicht gefunden",
        "ja": "注文が見つかりません",
        "fr": "Commande introuvable",
    },
    "Shipping option not found": {
        "ru": "Способ доставки не найден",
        "de": "Versandart nicht gefunden",
        "ja": "配送方法が見つかりません",
        "fr": "Mode de livraison introuvable",
    },
    "Cart is empty": {
        "ru": "Корзина пуста",
        "de": "Der Warenkorb ist leer",
        "ja": "カートは空です",
        "fr": "Le panier est vide",
    },
    "Order cannot be paid": {
        "ru": "Этот заказ нельзя оплатить",
        "de": "Diese Bestellung kann nicht bezahlt werden",
        "ja": "この注文は支払えません",
        "fr": "Cette commande ne peut pas être payée",
    },
    "Unsupported order status": {
        "ru": "Недопустимый статус заказа",
        "de": "Nicht unterstützter Bestellstatus",
        "ja": "対応していない注文ステータスです",
        "fr": "Statut de commande non pris en charge",
    },
    "Invalid or expired authentication token": {
        "ru": "Токен авторизации недействителен или истёк",
        "de": "Das Authentifizierungstoken ist ungültig oder abgelaufen",
        "ja": "認証トークンが無効または期限切れです",
        "fr": "Le jeton d’authentification est invalide ou expiré",
    },
    "Authentication required": {
        "ru": "Требуется авторизация",
        "de": "Anmeldung erforderlich",
        "ja": "ログインが必要です",
        "fr": "Authentification requise",
    },
    "Administrator access required": {
        "ru": "Требуются права администратора",
        "de": "Administratorrechte erforderlich",
        "ja": "管理者権限が必要です",
        "fr": "Accès administrateur requis",
    },
    "Only JPEG, PNG and WebP images are allowed": {
        "ru": "Разрешены только изображения JPEG, PNG и WebP",
        "de": "Nur JPEG-, PNG- und WebP-Bilder sind erlaubt",
        "ja": "JPEG、PNG、WebP画像のみ使用できます",
        "fr": "Seules les images JPEG, PNG et WebP sont autorisées",
    },
    "Image exceeds 5 MB": {
        "ru": "Размер изображения превышает 5 МБ",
        "de": "Das Bild ist größer als 5 MB",
        "ja": "画像サイズが5MBを超えています",
        "fr": "L’image dépasse 5 Mo",
    },
    "Currency catalogue is empty": {
        "ru": "Справочник валют пуст",
        "de": "Der Währungskatalog ist leer",
        "ja": "通貨カタログが空です",
        "fr": "Le catalogue des devises est vide",
    },
    "Category not found": {
        "ru": "Категория не найдена",
        "de": "Kategorie nicht gefunden",
        "ja": "カテゴリーが見つかりません",
        "fr": "Catégorie introuvable",
    },
    "Product slug already exists": {
        "ru": "Такой slug товара уже существует",
        "de": "Dieser Produkt-Slug ist bereits vorhanden",
        "ja": "この商品のスラッグはすでに存在します",
        "fr": "Ce slug de produit existe déjà",
    },
    "Product SKU already exists": {
        "ru": "Такой SKU товара уже существует",
        "de": "Diese Produkt-SKU ist bereits vorhanden",
        "ja": "この商品のSKUはすでに存在します",
        "fr": "Cette référence SKU existe déjà",
    },
    "Category slug already exists": {
        "ru": "Такой slug категории уже существует",
        "de": "Dieser Kategorie-Slug ist bereits vorhanden",
        "ja": "このカテゴリーのスラッグはすでに存在します",
        "fr": "Ce slug de catégorie existe déjà",
    },
    "Move or hide active products before hiding the category": {
        "ru": "Перед скрытием категории переместите или скройте активные товары",
        "de": "Verschieben oder verbergen Sie aktive Produkte, bevor Sie die Kategorie ausblenden",
        "ja": "カテゴリーを非表示にする前に、有効な商品を移動または非表示にしてください",
        "fr": "Déplacez ou masquez les produits actifs avant de masquer la catégorie",
    },
    "Shipping zone not found": {
        "ru": "Зона доставки не найдена",
        "de": "Versandzone nicht gefunden",
        "ja": "配送地域が見つかりません",
        "fr": "Zone de livraison introuvable",
    },
    "Message not found": {
        "ru": "Сообщение не найдено",
        "de": "Nachricht nicht gefunden",
        "ja": "メッセージが見つかりません",
        "fr": "Message introuvable",
    },
    "Invalid value": {
        "ru": "Некорректное значение",
        "de": "Ungültiger Wert",
        "ja": "入力内容が正しくありません",
        "fr": "Valeur incorrecte",
    },
    "Card authorization failed": {
        "ru": "Не удалось авторизовать карту",
        "de": "Die Karte konnte nicht autorisiert werden",
        "ja": "カードを承認できませんでした",
        "fr": "La carte n’a pas pu être autorisée",
    },
}

DYNAMIC_TRANSLATIONS = {
    "unavailable": {
        "en": "{name} is unavailable",
        "ru": "{name} сейчас недоступен",
        "de": "{name} ist nicht verfügbar",
        "ja": "{name}は現在利用できません",
        "fr": "{name} est indisponible",
    },
    "stock": {
        "en": "Insufficient stock for {name}",
        "ru": "Недостаточно товара в наличии: {name}",
        "de": "Nicht genügend Bestand für {name}",
        "ja": "{name}の在庫が不足しています",
        "fr": "Stock insuffisant pour {name}",
    },
}


def request_locale(request: Request) -> str:
    query_locale = request.query_params.get("locale", "").lower()
    if query_locale in SUPPORTED_LOCALES:
        return query_locale
    for language in request.headers.get("accept-language", "").split(","):
        locale = language.split(";", 1)[0].strip().lower().split("-", 1)[0]
        if locale in SUPPORTED_LOCALES:
            return locale
    return DEFAULT_LOCALE


def translate_error(detail: str, locale: str) -> str:
    if locale == DEFAULT_LOCALE:
        return detail
    translations = ERROR_TRANSLATIONS.get(detail)
    if translations:
        return translations.get(locale, detail)
    if detail.endswith(" is unavailable"):
        name = detail.removesuffix(" is unavailable")
        return DYNAMIC_TRANSLATIONS["unavailable"][locale].format(name=name)
    prefix = "Insufficient stock for "
    if detail.startswith(prefix):
        name = detail.removeprefix(prefix)
        return DYNAMIC_TRANSLATIONS["stock"][locale].format(name=name)
    return detail
