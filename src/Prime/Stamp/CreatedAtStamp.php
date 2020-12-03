<?php

namespace Flasher\Prime\Stamp;

use DateTime;
use DateTimeZone;
use Exception;

final class CreatedAtStamp implements StampInterface, OrderableStampInterface
{
    /**
     * @param DateTime
     */
    private $createdAt;

    /**
     * @param DateTime|null $createdAt
     *
     * @throws Exception
     */
    public function __construct(DateTime $createdAt = null)
    {
        $this->createdAt = $createdAt ?: new DateTime('now', new DateTimeZone('Africa/Casablanca'));
    }

    /**
     * @return DateTime
     */
    public function getCreatedAt()
    {
        return $this->createdAt;
    }

    /**
     * @param OrderableStampInterface $orderable
     *
     * @return int
     */
    public function compare($orderable)
    {
        if (!$orderable instanceof CreatedAtStamp) {
            return 0;
        }

        return $this->createdAt > $orderable->createdAt;
    }
}